import React from 'react';
import './LegalPages.css';

const TermsOfService = () => {
  return (
    <div className="legal-page-container">
      <div className="legal-page-content">
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last Updated: {new Date().toLocaleDateString()}</p>

        <section className="legal-section">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using the GIKPS Mail service ("Service"), provided by GIKPS ("Company," "we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, you may not use the Service.</p>
        </section>

        <section className="legal-section">
          <h2>2. Description of Service</h2>
          <p>GIKPS Mail is an internal email messaging service that enables registered users to send and receive electronic messages within the GIKPS domain (@gikpsmail.com). The Service is provided "as is" and may be modified, suspended, or discontinued at any time without notice.</p>
        </section>

        <section className="legal-section">
          <h2>3. User Accounts</h2>
          <ul>
            <li>You must provide accurate and complete information when creating an account.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You agree to notify us immediately of any unauthorized use of your account.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul>
            <li>Send spam, unsolicited mass emails, or chain letters.</li>
            <li>Transmit any material that is unlawful, harmful, threatening, abusive, or defamatory.</li>
            <li>Impersonate any person or entity, or misrepresent your affiliation with a person or entity.</li>
            <li>Interfere with or disrupt the Service or servers connected to the Service.</li>
            <li>Attempt to gain unauthorized access to any portion of the Service or any other systems or networks.</li>
            <li>Use the Service for any illegal purpose or in violation of any local, state, national, or international law.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Intellectual Property</h2>
          <p>The Service and its original content, features, and functionality are and will remain the exclusive property of GIKPS and its licensors. Your email messages remain your property, but you grant us a non-exclusive license to store, process, and transmit them solely for the purpose of providing the Service.</p>
        </section>

        <section className="legal-section">
          <h2>6. Privacy</h2>
          <p>Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to our collection and use of information as described in the Privacy Policy.</p>
        </section>

        <section className="legal-section">
          <h2>7. Disclaimer of Warranties</h2>
          <p><strong>THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.</strong></p>
          <p>GIKPS DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.</p>
        </section>

        <section className="legal-section">
          <h2>8. Limitation of Liability</h2>
          <p><strong>IN NO EVENT SHALL GIKPS, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:</strong></p>
          <ul>
            <li>Your access to or use of (or inability to access or use) the Service;</li>
            <li>Any conduct or content of any third party on the Service;</li>
            <li>Any content obtained from the Service; and</li>
            <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
          </ul>
          <p><strong>GIKPS'S TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED THE AMOUNT OF $ 0 USD.</strong></p>
        </section>

        <section className="legal-section">
          <h2>9. Indemnification</h2>
          <p>You agree to indemnify, defend, and hold harmless GIKPS and its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses arising from: (a) your use of the Service; (b) your violation of these Terms; or (c) your violation of any rights of any third party.</p>
        </section>

        <section className="legal-section">
          <h2>10. Termination</h2>
          <p>We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms. Upon termination, your right to use the Service will immediately cease.</p>
        </section>

        <section className="legal-section">
          <h2>11. Email Monitoring</h2>
          <p><strong>PLEASE NOTE: AS THIS IS AN INTERNAL ORGANIZATIONAL SERVICE, GIKPS RESERVES THE RIGHT TO MONITOR, ACCESS, RETAIN, AND DISCLOSE ANY EMAIL CONTENT IF REQUIRED BY LAW OR IF WE BELIEVE IN GOOD FAITH THAT SUCH ACTION IS NECESSARY TO:</strong></p>
          <ul>
            <li>Comply with a legal obligation or process;</li>
            <li>Protect and defend our rights or property; or</li>
            <li>Action is required to prevent fraud or security issues.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>12. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which GIKPS operates, without regard to its conflict of law provisions.</p>
        </section>

        <section className="legal-section">
          <h2>13. Changes to Terms</h2>
          <p>We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.</p>
        </section>

        <section className="legal-section">
          <h2>14. Contact Information</h2>
          <p>If you have any questions about these Terms, please contact us at: legal@gikpsmail.com</p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
