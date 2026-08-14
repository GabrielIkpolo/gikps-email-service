/**
 * End-to-End Adapter Test
 * Simulates how another app (like a Nodemailer integration) would use the GikpsMail adapter.
 */

import { createTransport } from './gikpsmail-adapter.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const API_URL = process.env.APP_URL || 'http://127.0.0.1:3001';
const API_KEY = process.env.MASTER_API_KEY;

let passCount = 0;
let failCount = 0;

function log(testName, passed, message) {
  const icon = passed ? '✅' : '❌';
  if (passed) passCount++; else failCount++;
  console.log(`  ${icon} ${testName}: ${message}`);
}

async function testAdapter() {
  console.log('\n🧪 ============================================');
  console.log('   GIKPSMAIL ADAPTER - END-TO-END TEST');
  console.log('   Simulating external app usage');
  console.log('============================================\n');

  // Create transporter exactly as an external app would
  const transporter = createTransport({
    host: API_URL,
    auth: {
      api_key: API_KEY,
      fromName: 'External App',
      fromAddress: 'app@external.com'
    }
  });

  // ---- TEST 1: Verify Transporter ----
  console.log('📋 Test 1: verify() - Check transporter configuration');
  try {
    const result = await transporter.verify();
    log('verify()', result, `Transporter verified (API URL: ${transporter.apiUrl})`);
  } catch (err) {
    log('verify()', false, err.message);
  }

  // ---- TEST 2: Send Simple Text Email ----
  console.log('\n📋 Test 2: sendMail() - Simple text email');
  try {
    const result = await transporter.sendMail({
      from: '"External App" <app@external.com>',
      to: 'receiver@gikpsmail.com',
      subject: 'Adapter Test #1 - Plain Text',
      text: 'Hello! This is a plain text email sent via the GikpsMail adapter.'
    });
    log('sendMail()', !!result.messageId, `Message ID: ${result.messageId}`);
    log('envelope.from', result.envelope?.from === 'app@external.com', `From: ${result.envelope?.from}`);
    log('accepted recipients', result.accepted?.length > 0, `${result.accepted?.length} recipient(s)`);
  } catch (err) {
    log('sendMail()', false, err.message);
  }

  // ---- TEST 3: Send HTML Email ----
  console.log('\n📋 Test 3: sendMail() - HTML email');
  try {
    const result = await transporter.sendMail({
      from: 'app@external.com',
      to: 'receiver@gikpsmail.com',
      subject: 'Adapter Test #2 - HTML Content',
      html: '<html><body><h1>Hello!</h1><p>This is an <strong>HTML</strong> email sent via the adapter.</p></body></html>'
    });
    log('sendMail()', !!result.messageId, `Message ID: ${result.messageId}`);
  } catch (err) {
    log('sendMail()', false, err.message);
  }

  // ---- TEST 4: Send with CC Recipients ----
  console.log('\n📋 Test 4: sendMail() - With CC recipients');
  try {
    const result = await transporter.sendMail({
      from: '"App" <app@external.com>',
      to: 'receiver@gikpsmail.com',
      cc: ['sender@gikpsmail.com'],
      subject: 'Adapter Test #3 - With CC',
      text: 'This email has a CC recipient.'
    });
    log('sendMail()', !!result.messageId, `Message ID: ${result.messageId}`);
  } catch (err) {
    log('sendMail()', false, err.message);
  }

  // ---- TEST 5: Send with BCC Recipients ----
  console.log('\n📋 Test 5: sendMail() - With BCC recipients');
  try {
    const result = await transporter.sendMail({
      from: 'app@external.com',
      to: 'receiver@gikpsmail.com',
      bcc: ['sender@gikpsmail.com'],
      subject: 'Adapter Test #4 - With BCC',
      text: 'This email has a BCC recipient.'
    });
    log('sendMail()', !!result.messageId, `Message ID: ${result.messageId}`);
  } catch (err) {
    log('sendMail()', false, err.message);
  }

  // ---- TEST 6: Send with Attachments (base64) ----
  console.log('\n📋 Test 6: sendMail() - With base64 attachment');
  try {
    const testFile = fs.readFileSync(path.join(__dirname, 'test_attachment.txt'));
    const base64Content = testFile.toString('base64');
    
    const result = await transporter.sendMail({
      from: '"App" <app@external.com>',
      to: 'receiver@gikpsmail.com',
      subject: 'Adapter Test #5 - With Attachment',
      text: 'This email has an attachment.',
      attachments: [
        {
          filename: 'test_attachment.txt',
          content: base64Content,
          contentType: 'text/plain'
        }
      ]
    });
    log('sendMail()', !!result.messageId, `Message ID: ${result.messageId}`);
  } catch (err) {
    log('sendMail()', false, err.message);
  }

  // ---- TEST 7: Send with Multiple Attachments ----
  console.log('\n📋 Test 7: sendMail() - With multiple attachments');
  try {
    const pngFile = fs.readFileSync(path.join(__dirname, 'test.png'));
    const pngBase64 = pngFile.toString('base64');

    const result = await transporter.sendMail({
      from: 'app@external.com',
      to: 'receiver@gikpsmail.com',
      subject: 'Adapter Test #6 - Multiple Attachments',
      text: 'Multiple attachments test.',
      attachments: [
        {
          filename: 'test.txt',
          content: 'SGVsbG8gV29ybGQ=', // "Hello World" in base64
          contentType: 'text/plain'
        },
        {
          filename: 'image.png',
          content: pngBase64,
          contentType: 'image/png'
        }
      ]
    });
    log('sendMail()', !!result.messageId, `Message ID: ${result.messageId}`);
  } catch (err) {
    log('sendMail()', false, err.message);
  }

  // ---- TEST 8: Error Handling - Missing "to" ----
  console.log('\n📋 Test 8: sendMail() - Error handling (missing recipient)');
  try {
    await transporter.sendMail({
      from: 'app@external.com',
      subject: 'Should Fail',
      text: 'No recipient!'
    });
    log('Error handling', false, 'Should have thrown an error');
  } catch (err) {
    const hasCorrectMessage = err.message.includes('"to"') || err.message.includes('recipient');
    log('Error handling', hasCorrectMessage, `Caught: "${err.message.substring(0, 60)}..."`);
  }

  // ---- TEST 9: Error Handling - Missing "subject" ----
  console.log('\n📋 Test 9: sendMail() - Error handling (missing subject)');
  try {
    await transporter.sendMail({
      from: 'app@external.com',
      to: 'receiver@gikpsmail.com',
      text: 'No subject!'
    });
    log('Error handling', false, 'Should have thrown an error');
  } catch (err) {
    const hasCorrectMessage = err.message.includes('"subject"') || err.message.includes('Subject');
    log('Error handling', hasCorrectMessage, `Caught: "${err.message.substring(0, 60)}..."`);
  }

  // ---- TEST 10: Error Handling - Invalid API Key ----
  console.log('\n📋 Test 10: sendMail() - Error handling (bad API key)');
  try {
    const badTransporter = createTransport({
      host: API_URL,
      auth: { api_key: 'invalid-key-12345' }
    });
    await badTransporter.sendMail({
      from: 'app@external.com',
      to: 'receiver@gikpsmail.com',
      subject: 'Should Fail - Bad Key',
      text: 'Testing bad API key error handling.'
    });
    log('Error handling (bad key)', false, 'Should have thrown an error');
  } catch (err) {
    const hasAuthError = err.message.includes('Authentication') || err.message.includes('401');
    log('Error handling (bad key)', hasAuthError, `Caught: "${err.message.substring(0, 60)}..."`);
  }

  // ---- TEST 11: Error Handling - Non-existent Recipient ----
  console.log('\n📋 Test 11: sendMail() - Error handling (non-existent recipient)');
  try {
    await transporter.sendMail({
      from: 'app@external.com',
      to: 'nonexistent@gikpsmail.com',
      subject: 'Should Fail - Bad Recipient',
      text: 'Testing non-existent recipient error.'
    });
    log('Error handling (bad recipient)', false, 'Should have thrown an error');
  } catch (err) {
    const has404 = err.message.includes('not found') || err.message.includes('404');
    log('Error handling (bad recipient)', has404, `Caught: "${err.message.substring(0, 60)}..."`);
  }

  // ---- TEST 12: close() method ----
  console.log('\n📋 Test 12: close() - Transporter cleanup');
  try {
    await transporter.close();
    log('close()', true, 'Transporter closed successfully (no-op for HTTP)');
  } catch (err) {
    log('close()', false, err.message);
  }

  // ---- SUMMARY ----
  console.log('\n📊 ============================================');
  console.log(`   RESULTS: ${passCount} passed, ${failCount} failed`);
  const total = passCount + failCount;
  const score = Math.round((passCount / total) * 100);
  console.log(`   SCORE: ${score}% (${passCount}/${total})`);
  console.log('============================================\n');

  process.exit(failCount > 0 ? 1 : 0);
}

testAdapter();
