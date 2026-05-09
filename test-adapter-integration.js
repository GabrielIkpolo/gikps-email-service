import { createTransport } from './frontend/src/utils/gikpsmail-adapter.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

async function testAdapter() {
  console.log('🧪 Testing GikpsMail Adapter (Nodemailer-style)...');
  
  const transporter = createTransport({
    host: process.env.APP_URL || 'http://localhost:3001',
    auth: {
      api_key: process.env.MASTER_API_KEY
    }
  });

  try {
    console.log('1. Verifying transporter...');
    const isValid = await transporter.verify();
    console.log(isValid ? '✅ Verification successful' : '❌ Verification failed');

    console.log('2. Sending email via adapter...');
    const mailOptions = {
      from: 'System <noreply@gikpsmail.com>',
      to: 'test@gikpsmail.com', // This will likely fail in our test-api if the user doesn't exist, but we are testing the adapter's logic
      subject: 'Adapter Test',
      text: 'Testing the adapter...',
      html: '<b>Testing the adapter...</b>'
    };

    // Note: This will likely fail with 404 because 'test@gikpsmail.com' isn't in our DB
    // but we want to see if the adapter correctly formats the request and handles the error.
    await transporter.sendMail(mailOptions);
    console.log('✅ SendMail successful (Unexpected if user doesn\'t exist)');

  } catch (error) {
    console.log('ℹ️ Expected error (if user doesn\'t exist):', error.message);
  }
}

testAdapter();
