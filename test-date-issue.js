// Test the date issue specifically
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TOKEN = 'yib<Z!UJLJH)SpL-)5<s>Mj}u@x(w1';

async function testDateIssue() {
  console.log('🔍 Testing Date Issue...\n');
  
  try {
    // Test 1: Check what current time info is returned
    console.log('1️⃣ Testing current time info...');
    const timeResponse = await axios.post(`${BASE_URL}/api/tools/voice_agent`, {
      action: 'search_availability',
      start_date: '2025-01-26T00:00:00Z',
      end_date: '2025-01-26T23:59:59Z'
    }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Current Time Info:');
    console.log('Current Time:', timeResponse.data.current_time);
    console.log('Current Time Pacific:', timeResponse.data.current_time_pacific);
    console.log('Current Date:', timeResponse.data.current_date);
    console.log('Current Day:', timeResponse.data.current_day);
    
    // Test 2: Check what the actual current date should be
    console.log('\n2️⃣ Actual current date (for comparison):');
    const now = new Date();
    const pacificTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
    console.log('Real Pacific Time:', pacificTime.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
    console.log('Real Pacific Date:', pacificTime.toLocaleDateString("en-US", {timeZone: "America/Los_Angeles"}));
    console.log('Real Pacific Day:', pacificTime.toLocaleDateString("en-US", {timeZone: "America/Los_Angeles", weekday: 'long'}));
    
    // Test 3: Test booking with today's date
    console.log('\n3️⃣ Testing booking with today\'s date...');
    const today = new Date();
    const todayISO = today.toISOString();
    console.log('Today ISO:', todayISO);
    
    const bookingResponse = await axios.post(`${BASE_URL}/api/tools/voice_agent`, {
      action: 'book_meeting',
      full_name: 'Today Test User',
      email: 'today.test@example.com',
      phone: '+1234567890',
      date_time: todayISO,
      duration_min: 30,
      reason: 'Today test booking'
    }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Today Booking Response:');
    console.log('Success:', bookingResponse.data.success);
    console.log('Message:', bookingResponse.data.message);
    console.log('Current Time in Response:', bookingResponse.data.current_time_pacific);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDateIssue();



