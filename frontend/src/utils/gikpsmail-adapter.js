import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * LAFIMail / GikpsMail HTTP Adapter for Nodemailer
 * 
 * This is a drop-in replacement for your existing nodemailer configuration.
 * Instead of using SMTP, it sends emails via HTTP to your LAFIMail service.
 * 
 * Installation:
 * 1. Copy this file to your project (e.g., utils/gikpsmail-adapter.js)
 * 2. Update your .env file with the GikpsMail configuration
 * 3. Replace your nodemailer imports with this adapter
 * 
 * Environment Variables:
 * - GIKPSMAIL_API_URL: URL of your GikpsMail service
 * - GIKPSMAIL_API_KEY: Your GikpsMail API key
 * - EMAIL_FROM_NAME: Display name for sent emails (optional)
 * - EMAIL_FROM_ADDRESS: Default from address (optional)
 */

// Configuration
const API_URL = process.env.GIKPSMAIL_API_URL || 'http://localhost:3001';
const API_KEY = process.env.GIKPSMAIL_API_KEY;
const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME || 'GikpsMail Service';
const DEFAULT_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'noreply@gikpsmail.com';

/**
 * HTTP Transporter class that mimics nodemailer's createTransport
 */
class HTTPTransporter {
  constructor(config = {}) {
    this.apiUrl = config.host || API_URL;
    this.apiKey = config.auth?.api_key || API_KEY;
    this.fromName = config.auth?.fromName || DEFAULT_FROM_NAME;
    this.fromAddress = config.auth?.fromAddress || DEFAULT_FROM_ADDRESS;
  }

  /**
   * Send mail - mimics nodemailer's sendMail method
   * @param {Object} mailOptions - Email options (from, to, subject, text, html, attachments, etc.)
   * @returns {Promise<Object>} - Send result with messageId
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

    // Validate required fields
    if (!to) {
      throw new Error('Recipient (to) is required');
    }
    if (!subject) {
      throw new Error('Subject is required');
    }

    // Parse from address
    let fromEmail = this.fromAddress;
    let fromName = this.fromName;

    if (from) {
      if (typeof from === 'string') {
        // Parse "Name <email@example.com>" format
        const match = from.match(/(?:"?([^"]*)"?\s)?<?([^\s>]+@[^\s>]+)>?/);
        if (match) {
          fromName = match[1] || fromName;
          fromEmail = match[2] || fromEmail;
        } else {
          fromEmail = from;
        }
      } else if (typeof from === 'object') {
        fromName = from.name || fromName;
        fromEmail = from.address || fromEmail;
      }
    }

    // Prepare payload
    const payload = {
      to: typeof to === 'string' ? to : (to.address || to.email),
      subject,
      text: text || '',
      html: html || text || '',
      fromName,
      fromEmail,
    };

    if (cc) {
      payload.cc = Array.isArray(cc) ? cc : [cc];
    }
    if (bcc) {
      payload.bcc = Array.isArray(bcc) ? bcc : [bcc];
    }

    if (attachments && attachments.length > 0) {
      payload.attachments = attachments.map(att => ({
        filename: att.filename || 'attachment',
        content: att.content // Expecting base64 string
      }));
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/api/mail/send`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          },
        }
      );

      return {
        messageId: response.data.data?.email?.id || `msg_${Date.now()}`,
        response: response.data,
        accepted: [to],
        rejected: [],
      };
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      throw new Error(`GikpsMail Transport Error: ${message}`);
    }
  }

  /**
   * Verify transporter configuration
   * Mimics nodemailer's verify method
   */
  async verify() {
    try {
      const response = await axios.get(`${this.apiUrl}/api/auth/verify`, {
        headers: {
          'X-API-Key': this.apiKey,
        },
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

/**
 * Create a HTTP transporter (mimics nodemailer.createTransport)
 * @param {Object} config - Configuration options
 * @returns {HTTPTransporter} - Transporter instance
 */
export function createTransport(config = {}) {
  return new HTTPTransporter(config);
}

export default {
  createTransport,
};
