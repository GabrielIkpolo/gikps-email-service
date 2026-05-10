import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.APP_URL || 'http://localhost:3001';
const MASTER_API_KEY = process.env.MASTER_API_KEY;

async function runTest() {
  const ts = Date.now();
  console.log(`🚀 Starting Email Search Integration Test (TS: ${ts})...\n`);

  try {
    // 1. Register & Login User
    console.log('Step 1: Registering and logging in test user...');
    const username = `testuser_${ts}`;
    const email = `testuser_${ts}@gikpsmail.com`;
    const password = 'password123';
    
    await axios.post(`${API_URL}/api/auth/register`, {
      username,
      password,
      email,
      fullName: 'Test User'
    });
    
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      username,
      password
    });
    const authToken = loginRes.data.token;
    console.log('✅ Test user ready.');

    // 2. Create Receiver
    console.log('Step 2: Creating receiver via Master API Key...');
    const receiverEmail = `receiver_${ts}@gikpsmail.com`;
    await axios.post(`${API_URL}/api/users/create`, {
      username: `receiver_${ts}`,
      password: 'password123',
      email: receiverEmail,
      fullName: 'Receiver User'
    }, {
      headers: { 'X-API-Key': MASTER_API_KEY }
    });
    console.log('✅ Receiver created.');

    // 3. Send Emails with specific subjects
    console.log('Step 3: Sending test emails with specific subjects...');
    const emailsToSend = [
      { subject: 'Apple Pie Recipe', text: 'Delicious apple pie recipe.' },
      { subject: 'Banana Bread', text: 'Moist banana bread recipe.' },
      { subject: 'Cherry Tart', text: 'Sweet cherry tart recipe.' }
    ];

    for (const mailData of emailsToSend) {
      await axios.post(`${API_URL}/api/mail/send`, {
        to: receiverEmail,
        ...mailData
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log(`✅ Sent: ${mailData.subject}`);
    }

    // 4. Get Receiver Token
    console.log('Step 4: Logging in receiver...');
    const receiverLoginRes = await axios.post(`${API_URL}/api/auth/login`, {
      username: `receiver_${ts}`,
      password: 'password123'
    });
    const receiverToken = receiverLoginRes.data.token;

    // 5. Test Search Functionality
    console.log('\nStep 5: Testing Search Functionality...\n');

    const testCases = [
      { query: 'Apple', expectedCount: 1, description: 'Searching for "Apple" (should find 1)' },
      { query: 'Banana', expectedCount: 1, description: 'Searching for "Banana" (should find 1)' },
      { query: 'Cherry', expectedCount: 1, description: 'Searching for "Cherry" (should find 1)' },
      { query: 'NonExistent', expectedCount: 0, description: 'Searching for "NonExistent" (should find 0)' },
      { query: 'e', expectedCount: 3, description: 'Searching for "e" (should find all 3)' },
    ];

    for (const tc of testCases) {
      console.log(`Testing: ${tc.description}...`);
      const res = await axios.get(`${API_URL}/api/mail/inbox?search=${tc.query}`, {
        headers: { Authorization: `Bearer ${receiverToken}` }
      });
      const count = res.data.data.emails.length;
      
      if (count === tc.expectedCount) {
        console.log(`✅ PASSED (Found ${count})`);
      } else {
        console.error(`❌ FAILED (Expected ${tc.expectedCount}, but found ${count})`);
        throw new Error(`Search failed for query "${tc.query}"`);
      }
    }

    console.log('\n🎉 ALL SEARCH TESTS PASSED SUCCESSFULLY!');

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
