/**
 * Test script to verify attachment upload fix
 * Tests both multipart/form-data (web UI) and JSON (adapter) endpoints
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import prisma from './src/config/db.js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const API_URL = process.env.APP_URL || 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_SECRET;

console.log('🧪 Testing attachment upload fix...\n');
console.log(`📡 API URL: ${API_URL}`);
console.log('');

// Get existing users from database
async function getTestUsers() {
  const sender = await prisma.user.findFirst({ where: { email: 'gab@gikpsmail.com' } });
  const receiver = await prisma.user.findFirst({ where: { email: 'receiver@gikpsmail.com' } });
  
  if (!sender || !receiver) {
    throw new Error('Test users not found in database. Please create gab@gikpsmail.com and receiver@gikpsmail.com');
  }
  
  return { sender, receiver };
}

function generateToken(userId, userEmail) {
  return jwt.sign(
    { id: userId, email: userEmail },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function testMultipartUpload() {
  console.log('='.repeat(60));
  console.log('TEST 1: Multipart/Form-Data Upload (Web UI)');
  console.log('='.repeat(60));
  
  try {
    const { sender, receiver } = await getTestUsers();
    
    // Read test image
    const imagePath = path.join(__dirname, 'test-image.png');
    if (!fs.existsSync(imagePath)) {
      console.warn('⚠️  Test image not found, creating a small PNG...');
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      fs.writeFileSync(imagePath, pngBuffer);
    }
    
    const testImage = fs.readFileSync(imagePath);
    console.log(`📎 Test image: ${imagePath} (${(testImage.length / 1024).toFixed(1)} KB)`);
    console.log(`   Sender: ${sender.email} (${sender.id})`);
    console.log(`   Receiver: ${receiver.email} (${receiver.id})`);
    
    // Create FormData
    const formData = new FormData();
    formData.append('to', receiver.email);
    formData.append('subject', 'Test Email with Attachment (Multipart)');
    formData.append('text', 'This is a test email sent via multipart/form-data.');
    formData.append('html', '<p>This is a <strong>test</strong> email.</p>');
    formData.append('attachments', testImage, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    
    console.log('\n📤 Sending multipart request...');
    const startTime = Date.now();
    
    const response = await axios.post(`${API_URL}/api/mail/send`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${generateToken(sender.id, sender.email)}`,
      },
      timeout: 120000, // 2 minutes
    });
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`✅ Response received in ${elapsed}s`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Message ID: ${response.data.data?.email?.id || 'N/A'}`);
    console.log(`   Attachments: ${response.data.data?.email?.attachments?.length || 0}`);
    
    if (response.data.data?.email?.attachments?.length > 0) {
      const att = response.data.data.email.attachments[0];
      console.log(`   Attachment URL: ${att.url}`);
      console.log(`   Attachment filename: ${att.filename}`);
      console.log(`   Attachment size: ${(att.size / 1024).toFixed(1)} KB`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Multipart upload test FAILED:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function testJsonUpload() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: JSON Upload (Adapter/HTTP)');
  console.log('='.repeat(60));
  
  try {
    const { sender, receiver } = await getTestUsers();
    
    // Read test image and convert to base64
    const imagePath = path.join(__dirname, 'test-image.png');
    const testImageBuffer = fs.readFileSync(imagePath);
    const base64Content = testImageBuffer.toString('base64');
    
    console.log(`📎 Test image: ${(testImageBuffer.length / 1024).toFixed(1)} KB (raw)`);
    console.log(`   Base64 content: ${(base64Content.length / 1024).toFixed(1)} KB`);
    
    const payload = {
      to: receiver.email,
      subject: 'Test Email with Attachment (JSON)',
      text: 'This is a test email sent via JSON.',
      html: '<p>This is a <strong>test</strong> email.</p>',
      fromName: 'Test Sender',
      fromEmail: sender.email,
      attachments: [{
        filename: 'test-image.png',
        content: base64Content,
        mimeType: 'image/png',
      }],
    };
    
    console.log('\n📤 Sending JSON request...');
    const startTime = Date.now();
    
    const response = await axios.post(`${API_URL}/api/mail/send-json`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.MASTER_API_KEY || 'your_master_api_key_for_external_apps',
      },
      timeout: 120000, // 2 minutes
    });
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`✅ Response received in ${elapsed}s`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Message ID: ${response.data.messageId || response.data.data?.email?.id || 'N/A'}`);
    console.log(`   Attachments: ${response.data.data?.email?.attachments?.length || 0}`);
    
    if (response.data.data?.email?.attachments?.length > 0) {
      const att = response.data.data.email.attachments[0];
      console.log(`   Attachment URL: ${att.url}`);
      console.log(`   Attachment filename: ${att.filename}`);
      console.log(`   Attachment size: ${(att.size / 1024).toFixed(1)} KB`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ JSON upload test FAILED:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function runTests() {
  const results = [];
  
  try {
    // Test 1: Multipart upload (web UI)
    results.push({ name: 'Multipart Upload', passed: await testMultipartUpload() });
    
    // Test 2: JSON upload (adapter)
    results.push({ name: 'JSON Upload', passed: await testJsonUpload() });
  } finally {
    await prisma.$disconnect();
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  for (const result of results) {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`   ${result.name}: ${status}`);
  }
  
  const allPassed = results.every(r => r.passed);
  console.log('\n' + (allPassed ? '🎉 All tests passed!' : '⚠️  Some tests failed.'));
  
  process.exit(allPassed ? 0 : 1);
}

runTests().catch(err => {
  console.error('❌ Test runner error:', err.message);
  prisma.$disconnect();
  process.exit(1);
});
