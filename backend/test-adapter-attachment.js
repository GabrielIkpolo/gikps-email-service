/**
 * Test script for adapter attachment sending via JSON endpoint
 * Run with: node test-adapter-attachment.js
 */

import { createTransport } from '../gikpsmail-adapter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '.env') });

async function testAttachmentSend() {
  console.log('🧪 Testing adapter attachment send...\n');

  // Create transporter with explicit timeout of 3 minutes
  const transporter = createTransport({
    host: process.env.GIKPSMAIL_API_URL || 'http://localhost:3001',
    auth: {
      api_key: process.env.MASTER_API_KEY,
      fromName: process.env.EMAIL_FROM_NAME || 'Test Sender',
      fromAddress: process.env.EMAIL_FROM_ADDRESS || 'test@test.com',
    },
    timeout: 180000, // 3 minutes
  });

  console.log(`📡 API URL: ${transporter.apiUrl}`);
  console.log(`⏱️  Timeout: ${transporter.timeout}ms (${transporter.timeout / 1000}s)`);
  console.log('');

  try {
    // Verify connection first
    const isVerified = await transporter.verify();
    console.log(`✅ Transport verified: ${isVerified}`);
    if (!isVerified) {
      console.warn('⚠️  Transport verification failed, but continuing with test...');
    }

    // Create a small test image (1x1 red pixel PNG) as base64
    const testImageBase64 = fs.readFileSync(
      path.join(__dirname, 'test-image.png'),
      'base64'
    );

    console.log(`📎 Test image size: ${(testImageBase64.length / 1024).toFixed(1)} KB (base64)`);

    // Send email with attachment
    const result = await transporter.sendMail({
      from: '"Test Sender" <test@test.com>',
      to: process.env.TEST_RECIPIENT_EMAIL || 'test@gikpsmail.com',
      subject: '🧪 Test Email with Attachment (Adapter Fix)',
      text: 'This is a test email sent via the GikpsMail adapter with an attachment.',
      html: '<h2>Test Email</h2><p>This email was sent via the <strong>GikpsMail adapter</strong> with an attached image.</p>',
      attachments: [{
        filename: 'test-image.png',
        content: testImageBase64,
        contentType: 'image/png',
      }],
    });

    console.log('\n✅ Email sent successfully!');
    console.log(`📋 Message ID: ${result.messageId}`);
    console.log(`👥 Accepted: ${result.accepted.join(', ')}`);
    console.log(`❌ Rejected: ${result.rejected.length > 0 ? result.rejected.join(', ') : 'none'}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.code) console.error(`   Error code: ${error.code}`);
    if (error.detail) console.error(`   Detail: ${error.detail}`);
    process.exit(1);
  }

  await transporter.close();
  console.log('\n✅ Test complete!');
}

testAttachmentSend();
