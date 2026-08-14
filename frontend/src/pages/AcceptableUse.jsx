import React from 'react';
import './LegalPages.css';

const AcceptableUse = () => {
  return (
    <div className="legal-page-container">
      <div className="legal-page-content">
        <h1>Acceptable Use Policy</h1>
        <p className="legal-updated">Last Updated: {new Date().toLocaleDateString()}</p>

        <section className="legal-section">
          <h2>1. Purpose</h2>
          <p>This Acceptable Use Policy ("AUP") establishes the rules and guidelines for using the GIKPS Mail service. By accessing or using the Service, you agree to comply with this AUP.</p>
        </section>

        <section className="legal-section">
          <h2>2. Permitted Uses</h2>
          <p>The GIKPS Mail Service is intended for legitimate organizational communication purposes, including but not limited to:</p>
          <ul>
            <li>Internal business communications between authorized users;</li>
            <li>Sending and receiving professional correspondence;</li>
            <li>Sharing documents and files within the organization;</li>
            <li>Participating in project-related discussions via email;</li>
            <li>Administrative and operational communications.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Prohibited Activities</h2>
          <p>You expressly agree that you will not use the Service to engage in any of the following activities:</p>

          <h3>3.1 Spam and Unsolicited Communications</h3>
          <ul>
            <li>Sending bulk, mass, or unsolicited emails ("spam") to recipients who have not opted in;</li>
            <li>Using the Service as a relay for third-party spam;</li>
            <li>Sending chain letters, pyramid schemes, or lottery notifications;</li>
            <li>Harvesting email addresses from the Service for marketing purposes.</li>
          </ul>

          <h3>3.2 Illegal Content</h3>
          <ul>
            <li>Distributing material that violates any applicable law, regulation, or ordinance;</li>
            <li>Sending child sexual abuse material (CSAM) or any content involving minors in a sexual manner;</li>
            <li>Distributing copyrighted material without authorization;</li>
            <li>Facilitating the sale of illegal substances, weapons, or stolen goods.</li>
          </ul>

          <h3>3.3 Harmful Content</h3>
          <ul>
            <li>Sending threats of violence, harassment, or intimidation;</li>
            <li>Distributing defamatory, libelous, or slanderous content;</li>
            <li>Sending hate speech or content that promotes discrimination based on race, religion, gender, sexual orientation, disability, or other protected characteristics;</li>
            <li>Distributing obscene or pornographic material.</li>
          </ul>

          <h3>3.4 Technical Abuse</h3>
          <ul>
            <li>Sending emails with forged headers or spoofed sender addresses;</li>
            <li>Attempting to hack, breach, or gain unauthorized access to any system;</li>
            <li>Using the Service to distribute malware, viruses, or other harmful code;</li>
            <li>Conducting denial-of-service attacks or flooding the Service with messages;</li>
            <li>Automating email sending beyond normal human interaction patterns.</li>
          </ul>

          <h3>3.5 Privacy Violations</h3>
          <ul>
            <li>Sending emails that disclose another person's private information without consent ("doxxing");</li>
            <li>Impersonating another user or entity;</li>
            <li>Attempting to access other users' accounts or email messages.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Attachment Guidelines</h2>
          <p>When sending attachments, you agree to:</p>
          <ul>
            <li>Ensure all files are free of malware, viruses, or harmful code;</li>
            <li>Not send executable files (.exe, .bat, .scr, etc.) unless explicitly authorized by administrators;</li>
            <li>Keep attachment sizes within the limits specified by the Service;</li>
            <li>Not send files containing personal data of third parties without their consent.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Monitoring and Enforcement</h2>
          <p><strong>GIKPS RESERVES THE RIGHT TO MONITOR EMAIL CONTENT AND METADATA TO ENSURE COMPLIANCE WITH THIS AUP.</strong></p>
          
          <p>Potential enforcement actions include, but are not limited to:</p>
          <ul>
            <li>Warning the offending user;</li>
            <li>Suspending email sending privileges temporarily or permanently;</li>
            <li>Terminating the user's account without refund of any fees;</li>
            <li>Reporting illegal activities to law enforcement authorities;</li>
            <li>Preserving evidence for legal proceedings.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. Reporting Violations</h2>
          <p>If you become aware of any violation of this AUP, please report it immediately to: abuse@gikpsmail.com</p>
          <p>We will investigate all reports and take appropriate action. Reports can be submitted anonymously.</p>
        </section>

        <section className="legal-section">
          <h2>7. Service Availability Disclaimer</h2>
          <p><strong>GIKPS DOES NOT GUARANTEE 100% UPTIME OR IMMEDIATE DELIVERY OF EMAILS.</strong></p>
          <p>The Service may experience downtime due to maintenance, technical issues, or force majeure events. GIKPS is not liable for any delays in email delivery or temporary unavailability of the Service.</p>
        </section>

        <section className="legal-section">
          <h2>8. Account Termination</h2>
          <p>GIKPS reserves the right to terminate or suspend accounts at its sole discretion, with or without notice, for any violation of this AUP or these Terms of Service. Upon termination:</p>
          <ul>
            <li>All access to the Service will be immediately revoked;</li>
            <li>Email data may be retained for up to 30 days for backup purposes before permanent deletion;</li>
            <li>No refunds will be issued for prepaid services (if applicable).</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>9. Amendments</h2>
          <p>This AUP may be updated from time to time at GIKPS's discretion. Continued use of the Service after changes constitutes acceptance of the revised policy.</p>
        </section>

        <section className="legal-section">
          <h2>10. Contact</h2>
          <p>Questions about this Acceptable Use Policy should be directed to: legal@gikpsmail.com</p>
        </section>
      </div>
    </div>
  );
};

export default AcceptableUse;
