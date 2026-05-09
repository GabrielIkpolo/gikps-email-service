import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.APP_URL || 'http://localhost:3001';
const MASTER_API_KEY = process.env.MASTER_API_KEY;

async function runTest() {
  const ts = Date.now();
  console.log(`🚀 Starting API Integration Test (TS: ${ts})...\n`);

  try {
    // 1. Register Sender
    console.log('Step 1: Registering sender...');
    const senderUsername = `sender_${ts}`;
    const senderEmail = `sender_${ts}@gikpsmail.com`;
    await axios.post(`${API_URL}/api/auth/register`, {
      username: senderUsername,
      password: 'password123',
      email: senderEmail,
      fullName: 'Sender User'
    });
    console.log('✅ Sender registered.');

    // 2. Login Sender
    console.log('Step 2: Logging in sender...');
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      username: senderUsername,
      password: 'password123'
    });
    const authToken = loginRes.data.token;
    console.log('✅ Login successful.');

    // 3. Create Receiver (via Master API Key)
    console.log('Step 3: Creating receiver via Master API Key...');
    const receiverUsername = `receiver_${ts}`;
    const receiverEmail = `receiver_${ts}@gikpsmail.com`;
    const receiverPassword = 'receiverpassword123';
    await axios.post(`${API_URL}/api/users/create`, {
      username: receiverUsername,
      password: receiverPassword,
      email: receiverEmail,
      fullName: 'Receiver User'
    }, {
      headers: { 'X-API-Key': MASTER_API_KEY }
    });
    console.log('✅ Receiver created.');

    // 4. Login Receiver (to get its token)
    console.log('Step 4: Logging in receiver...');
    const receiverLoginRes = await axios.post(`${API_URL}/api/auth/login`, {
      username: receiverUsername,
      password: receiverPassword
    });
    const receiverToken = receiverLoginRes.data.token;
    console.log('✅ Receiver login successful.');

    // 5. Send Email
    console.log('Step 5: Sending email...');
    const mailRes = await axios.post(`${API_URL}/api/mail/send`, {
      to: receiverEmail,
      subject: `Test Email ${ts}`,
      text: 'Hello! This is a test email.',
      html: '<h1>Hello!</h1><p>This is a test email.</p>'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Email sent:', mailRes.data.data.email.id);

    // 6. Check Receiver Inbox
    console.log('Step 6: Checking receiver inbox...');
    const inboxRes = await axios.get(`${API_URL}/api/mail/inbox`, {
      headers: { Authorization: `Bearer ${receiverToken}` }
    });
    console.log('✅ Inbox check successful. Messages found:', inboxRes.data.data.emails.length);
    if (inboxRes.data.data.emails.length > 0) {
      console.log('📩 Last message subject:', inboxRes.data.data.emails[0].subject);
    }

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');

  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    if (error.response) {
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response Status:', error.response.status);
    } else {
      console.error('Error Message:', error.message);
    }
    process.exit(1);
  }
}

runTest();
