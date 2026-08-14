import React from 'react';
import './LegalPages.css';

const PrivacyPolicy = () => {
  return (
    <div className="legal-page-container">
      <div className="legal-page-content">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last Updated: {new Date().toLocaleDateString()}</p>

        <section className="legal-section">
          <h2>1. Introduction</h2>
          <p>GIKPS Mail ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our email messaging service (@gikpsmail.com).</p>
        </section>

        <section className="legal-section">
          <h2>2. Information We Collect</h2>
          
          <h3>2.1 Account Information</h3>
          <ul>
            <li><strong>Personal Identifiers:</strong> Full name, username, and email address provided during registration.</li>
            <li><strong>Credentials:</strong> Passwords are stored using bcrypt hashing (one-way encryption). We never store passwords in plain text.</li>
          </ul>

          <h3>2.2 Email Content</h3>
          <ul>
            <li><strong>Sent and Received Messages:</strong> Subject lines, message bodies (text and HTML), and attachments are stored on our servers to enable the Service's functionality.</li>
            <li><strong>Email Metadata:</strong> Timestamps, sender/receiver information, read status, and star/favorite flags.</li>
          </ul>

          <h3>2.3 Technical Data</h3>
          <ul>
            <li><strong>Usage Information:</strong> Login times, IP addresses, device information, and browser types for security and analytics purposes.</li>
            <li><strong>Cookies:</strong> We use session tokens stored in localStorage for authentication. No tracking cookies are used.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information for the following purposes:</p>
          <ul>
            <li>To provide, maintain, and improve the GIKPS Mail Service;</li>
            <li>To authenticate users and prevent unauthorized access;</li>
            <li>To send transactional communications (password resets, security alerts);</li>
            <li>To detect, investigate, and prevent fraudulent transactions and other illegal activities;</li>
            <li>To comply with legal obligations;</li>
            <li>To monitor and analyze usage patterns and trends.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Data Encryption & Security</h2>
          <p>We implement industry-standard security measures to protect your data:</p>
          <ul>
            <li><strong>AES-256-GCM Encryption:</strong> Email content is encrypted at rest using AES-256-GCM symmetric encryption. Only authorized users with valid session tokens can decrypt and read messages.</li>
            <li><strong>TLS/SSL:</strong> All data transmitted between your browser and our servers is encrypted using TLS 1.3.</li>
            <li><strong>Bcrypt Hashing:</strong> Passwords are hashed using bcrypt with a cost factor of 12 before storage.</li>
            <li><strong>JWT Authentication:</strong> Session management uses JSON Web Tokens with configurable expiration.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Data Storage & Retention</h2>
          <p><strong>Storage Location:</strong> Your data is stored on servers located in [Specify Jurisdiction]. We use MongoDB for database storage and Cloudinary (or local filesystem) for attachment storage.</p>
          
          <p><strong>Retention Period:</strong></p>
          <ul>
            <li>Email messages are retained indefinitely unless deleted by the user or administrator.</li>
            <li>Account data is retained until account deletion is requested.</li>
            <li>Log files containing IP addresses and login timestamps are retained for 90 days for security purposes.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. Data Sharing & Disclosure</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
          <ul>
            <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental request.</li>
            <li><strong>Service Providers:</strong> With trusted third-party service providers (e.g., Cloudinary for storage) who are bound by confidentiality agreements and process data only on our instructions.</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, where user data may be transferred as a business asset.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>7. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
            <li><strong>Deletion:</strong> Request deletion of your account and associated data ("Right to be Forgotten").</li>
            <li><strong>Portability:</strong> Request a machine-readable copy of your data.</li>
            <li><strong>Objection:</strong> Object to processing of your data for certain purposes.</li>
          </ul>
          <p>To exercise any of these rights, contact us at: privacy@gikpsmail.com</p>
        </section>

        <section className="legal-section">
          <h2>8. Children's Privacy</h2>
          <p>The Service is not intended for children under the age of 16. We do not knowingly collect personal information from children under 16. If we discover that we have collected data from a child under 16, we will take immediate steps to delete such information.</p>
        </section>

        <section className="legal-section">
          <h2>9. International Data Transfers</h2>
          <p>Your information may be transferred to and processed in countries other than the country in which you reside. These countries may have data protection laws that differ from the laws of your country. By using the Service, you consent to such transfers.</p>
        </section>

        <section className="legal-section">
          <h2>10. Data Breach Notification</h2>
          <p>In the event of a data breach that affects your personal information, we will notify affected users via email within 72 hours of becoming aware of the breach, as required by applicable data protection laws.</p>
        </section>

        <section className="legal-section">
          <h2>11. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify users of any material changes via email or through a notice on the Service at least 30 days before the change takes effect.</p>
        </section>

        <section className="legal-section">
          <h2>12. Contact Information</h2>
          <p>If you have questions about this Privacy Policy, please contact us at: privacy@gikpsmail.com</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
