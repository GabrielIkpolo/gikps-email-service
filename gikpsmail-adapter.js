import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * GikpsMail HTTP Adapter for Nodemailer
 * 
 * A drop-in replacement for nodemailer that sends emails via HTTP/HTTPS
 * to your GikpsMail service. Designed for platforms like Render.com where
 * SMTP is blocked.
 * 
 * Installation:
 * 1. Copy this file to your project (e.g., utils/gikpsmail-adapter.js)
 * 2. Update your .env with the GikpsMail configuration
 * 3. Use createTransport() just like nodemailer.createTransport()
 * 
 * Environment Variables:
 * - GIKPSMAIL_API_URL: URL of your GikpsMail service (e.g., https://your-app.onrender.com)
 * - GIKPSMAIL_API_KEY: Your GikpsMail Master API Key
 * - EMAIL_FROM_NAME: Display name for sent emails (optional, default: 'GikpsMail Service')
 * - EMAIL_FROM_ADDRESS: Default from address (optional, default: 'noreply@gikpsmail.com')
 */

// Configuration with sensible defaults
const API_URL = (process.env.GIKPSMAIL_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
const API_KEY = process.env.GIKPSMAIL_API_KEY;
const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME || 'GikpsMail Service';
const DEFAULT_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'noreply@gikpsmail.com';

/**
 * HTTP Transporter class that mimics nodemailer's createTransport interface
 */
class GikpsMailTransporter {
  constructor(config = {}) {
    this.name = 'gikpsmail-transport';
    this.version = '1.0.0';
    
    // Allow config to override env vars
    this.apiUrl = (config.host || API_URL).replace(/\/+$/, '');
    this.apiKey = config.auth?.api_key || API_KEY;
    this.fromName = config.auth?.fromName || DEFAULT_FROM_NAME;
    this.fromAddress = config.auth?.fromAddress || DEFAULT_FROM_ADDRESS;
    
    // Timeout for requests (in ms)
    this.timeout = config.timeout || 30000;
    
    // Validate configuration on construction
    if (!this.apiKey) {
      console.warn('[GikpsMail] Warning: No API key configured. Emails will fail to send.');
    }
  }

  /**
   * Parse a from address string into name and email components
   * Supports formats: "Name <email>", "email", or object {name, address}
   */
  _parseFrom(from) {
    let fromEmail = this.fromAddress;
    let fromName = this.fromName;

    if (!from) {
      return { fromEmail, fromName };
    }

    if (typeof from === 'string') {
      // Try to parse "Display Name <email@example.com>" format
      const match = from.match(/(?:"?([^"]*)"?\s)?<?([^\s>]+@[^\s>]+)>?/);
      if (match) {
        fromName = match[1] || this.fromName;
        fromEmail = match[2] || this.fromAddress;
      } else {
        // Just an email address
        fromEmail = from.trim();
      }
    } else if (typeof from === 'object') {
      fromName = from.name || fromName;
      fromEmail = from.address || from.email || this.fromAddress;
    }

    return { fromEmail, fromName };
  }

  /**
   * Format recipient addresses to strings
   */
  _formatRecipient(recipient) {
    if (!recipient) return '';
    if (typeof recipient === 'string') return recipient.trim();
    if (typeof recipient === 'object') {
      return recipient.address || recipient.email || '';
    }
    return String(recipient);
  }

  /**
   * Send mail - mimics nodemailer's sendMail method
   * @param {Object} mailOptions - Email options compatible with nodemailer
   * @returns {Promise<Object>} - Nodemailer-compatible response object
   */
  async sendMail(mailOptions) {
    const {
      from,
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      attachments,
    } = mailOptions;

    // Validate required fields (nodemailer standard)
    if (!to && !mailOptions.to) {
      throw new Error('Missing required field: "to" recipient is required');
    }
    if (!subject) {
      throw new Error('Missing required field: "subject" is required');
    }

    // Parse from address
    const { fromEmail, fromName } = this._parseFrom(from);

    // Format recipients
    const toRecipients = Array.isArray(to) 
      ? to.map(r => this._formatRecipient(r)).filter(Boolean)
      : [this._formatRecipient(to)];

    if (toRecipients.length === 0) {
      throw new Error('No valid recipient addresses provided');
    }

    // Prepare payload matching the backend's JSON endpoint format
    const payload = {
      to: toRecipients[0], // Backend expects single 'to' for now
      subject,
      text: text || '',
      html: html || text || '',
      fromName,
      fromEmail,
    };

    // Handle CC recipients
    if (cc) {
      payload.cc = Array.isArray(cc) 
        ? cc.map(r => this._formatRecipient(r)).filter(Boolean)
        : [this._formatRecipient(cc)];
    }

    // Handle BCC recipients  
    if (bcc) {
      payload.bcc = Array.isArray(bcc)
        ? bcc.map(r => this._formatRecipient(r)).filter(Boolean)
        : [this._formatRecipient(bcc)];
    }

    // Handle attachments (base64 encoded)
    if (attachments && attachments.length > 0) {
      payload.attachments = attachments.map(att => ({
        filename: att.filename || 'attachment',
        content: att.content || '', // Expecting base64 string
        mimeType: att.contentType || att.mime || 'application/octet-stream',
      }));
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/api/mail/send-json`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          },
          timeout: this.timeout,
        }
      );

      const responseData = response.data;
      
      // Extract message ID from various possible response formats
      const messageId = 
        responseData.messageId || 
        responseData.data?.email?.id || 
        `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      return {
        messageId: messageId,
        accepted: toRecipients,
        rejected: [],
        envelope: {
          from: fromEmail,
          to: toRecipients,
        },
        message: 'Email sent successfully',
      };
    } catch (error) {
      // Provide detailed error information for debugging
      let errorMessage = 'GikpsMail Transport Error';
      
      if (error.response) {
        // Server responded with an error status
        const status = error.response.status;
        const serverError = error.response.data?.error || error.response.data?.message;
        
        if (status === 401 || status === 403) {
          errorMessage += ': Authentication failed. Check your API key.';
        } else if (status === 404) {
          errorMessage += `: ${serverError || 'Recipient not found'}`;
        } else if (status >= 500) {
          errorMessage += ': Server error. Please try again later.';
        } else {
          errorMessage += `: ${serverError || error.response.statusText}`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage += ': No response from server. Check your API URL and network connection.';
      } else {
        errorMessage += `: ${error.message}`;
      }

      const nodemailerError = new Error(errorMessage);
      nodemailerError.code = error.response?.status ? `E${error.response.status}` : 'ENETWORK';
      nodemailerError.detail = error.message;
      
      throw nodemailerError;
    }
  }

  /**
   * Verify transporter configuration
   * Mimics nodemailer's verify method
   * @returns {Promise<boolean>} - True if configuration is valid
   */
  async verify() {
    try {
      const response = await axios.get(`${this.apiUrl}/api/auth/verify`, {
        headers: {
          'X-API-Key': this.apiKey,
        },
        timeout: this.timeout,
      });
      
      return response.status === 200 && response.data.status === 'success';
    } catch (error) {
      console.error('[GikpsMail] Transport verification failed:', error.message);
      return false;
    }
  }

  /**
   * Close transporter (no-op for HTTP transport)
   */
  close() {
    // No connections to close for HTTP-based transport
    return Promise.resolve();
  }
}

/**
 * Create a GikpsMail HTTP transporter
 * Mimics nodemailer.createTransport() interface
 * 
 * @param {Object} config - Configuration options
 * @param {string} config.host - API URL (e.g., 'https://your-app.onrender.com')
 * @param {Object} config.auth - Authentication credentials
 * @param {string} config.auth.api_key - Master API Key from GikpsMail settings
 * @param {string} [config.auth.fromName] - Default sender display name
 * @param {string} [config.auth.fromAddress] - Default sender email address
 * @param {number} [config.timeout=30000] - Request timeout in milliseconds
 * @returns {GikpsMailTransporter} - Transporter instance
 * 
 * @example
 * const transporter = createTransport({
 *   host: 'https://gikps-email-service.onrender.com',
 *   auth: {
 *     api_key: 'your-master-api-key-here'
 *   }
 * });
 * 
 * await transporter.sendMail({
 *   from: '"GIKPS Admin" <admin@gikpsmail.com>',
 *   to: 'user@gikpsmail.com',
 *   subject: 'Hello!',
 *   text: 'This email was sent via HTTP!'
 * });
 */
export function createTransport(config = {}) {
  return new GikpsMailTransporter(config);
}

// Default export for CommonJS compatibility
export default {
  createTransport,
};
