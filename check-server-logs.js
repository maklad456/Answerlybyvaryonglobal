// Check what's happening in the server logs
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TOKEN = 'yib<Z!UJLJH)SpL-)5<s>Mj}u@x(w1';

async function checkServerLogs() {
  console.log('🔍 Checking Server Logs and Email Status...\n');
  
  try {
    // Test booking and check for any errors in the response
    console.log('1️⃣ Testing booking with detailed error checking...');
    const bookingResponse = await axios.post(`${BASE_URL}/api/tools/voice_agent`, {
      action: 'book_meeting',
      full_name: 'Log Test User',
      email: 'log.test@example.com',
      phone: '+1234567890',
      date_time: '2025-01-28T10:00:00Z',
      duration_min: 30,
      reason: 'Log test booking'
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
    
    // Check if there are any error details
    if (bookingResponse.data.error) {
      console.log('❌ Error in response:', bookingResponse.data.error);
    }
    
    // Test the website booking to compare
    console.log('\n2️⃣ Testing website booking for comparison...');
    try {
      const websiteResponse = await axios.post(`${BASE_URL}/api/book`, {
        full_name: 'Website Log Test',
        email: 'website.log@example.com',
        phone: '+1234567890',
        reason: 'Website log test',
        start_iso: '2025-01-29T10:00:00Z',
        duration_min: 30,
        notes: 'Website test'
      });
      
      console.log('✅ Website Response:');
      console.log('Success:', websiteResponse.data.success);
      console.log('Meeting ID:', websiteResponse.data.meeting_id);
      console.log('Join URL:', websiteResponse.data.join_url);
      
      if (websiteResponse.data.error) {
        console.log('❌ Website Error:', websiteResponse.data.error);
      }
      
    } catch (websiteError) {
      console.log('❌ Website booking failed:', websiteError.response?.data || websiteError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkServerLogs();



