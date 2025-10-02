// Test email functionality with detailed debugging
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TOKEN = 'yib<Z!UJLJH)SpL-)5<s>Mj}u@x(w1';

async function testEmailDebug() {
  console.log('🔍 Testing Email Functionality with Debug...\n');
  
  try {
    // Test booking and check for email errors
    console.log('1️⃣ Testing booking with email debugging...');
    const bookingResponse = await axios.post(`${BASE_URL}/api/tools/voice_agent`, {
      action: 'book_meeting',
      full_name: 'Email Debug Test',
      email: 'email.debug@example.com',
      phone: '+1234567890',
      date_time: '2025-01-30T10:00:00Z',
      duration_min: 30,
      reason: 'Email debug test'
    }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Booking Response:');
    console.log('Success:', bookingResponse.data.success);
    console.log('Message:', bookingResponse.data.message);
    console.log('Meeting ID:', bookingResponse.data.meeting_id);
    console.log('Join URL:', bookingResponse.data.join_url);
    
    // Check if there are any email-related errors in the response
    if (bookingResponse.data.email_errors) {
      console.log('❌ Email Errors:', bookingResponse.data.email_errors);
    }
    
    // Test the website booking to compare
    console.log('\n2️⃣ Testing website booking for comparison...');
    const websiteResponse = await axios.post(`${BASE_URL}/api/book`, {
      full_name: 'Website Email Debug',
      email: 'website.email@example.com',
      phone: '+1234567890',
      reason: 'Website email debug',
      start_iso: '2025-01-31T10:00:00Z',
      duration_min: 30,
      notes: 'Website email test'
    });
    
    console.log('✅ Website Response:');
    console.log('Success:', websiteResponse.data.success);
    console.log('Meeting ID:', websiteResponse.data.meeting_id);
    console.log('Join URL:', websiteResponse.data.join_url);
    
    if (websiteResponse.data.email_errors) {
      console.log('❌ Website Email Errors:', websiteResponse.data.email_errors);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testEmailDebug();



