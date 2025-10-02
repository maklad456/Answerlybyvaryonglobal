// Test the fixed date functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TOKEN = 'yib<Z!UJLJH)SpL-)5<s>Mj}u@x(w1';

async function testFixedDate() {
  console.log('🔍 Testing Fixed Date Functionality...\n');
  
  try {
    // Test the voice agent with updated date info
    console.log('1️⃣ Testing voice agent with updated date info...');
    const response = await axios.post(`${BASE_URL}/api/tools/voice_agent`, {
      action: 'search_availability',
      start_date: '2025-01-26T00:00:00Z',
      end_date: '2025-01-26T23:59:59Z'
    }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Updated Date Info:');
    console.log('Current Time (UTC):', response.data.current_time);
    console.log('Current Time Pacific:', response.data.current_time_pacific);
    console.log('Current Date Pacific:', response.data.current_date);
    console.log('Current Day Pacific:', response.data.current_day);
    console.log('Current Date UTC:', response.data.current_date_utc);
    console.log('Current Day UTC:', response.data.current_day_utc);
    
    // Test booking with current date
    console.log('\n2️⃣ Testing booking with current date...');
    const now = new Date();
    const todayISO = now.toISOString();
    console.log('Today ISO for booking:', todayISO);
    
    const bookingResponse = await axios.post(`${BASE_URL}/api/tools/voice_agent`, {
      action: 'book_meeting',
      full_name: 'Fixed Date Test',
      email: 'fixed.date@example.com',
      phone: '+1234567890',
      date_time: todayISO,
      duration_min: 30,
      reason: 'Fixed date test'
    }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Booking Response:');
    console.log('Success:', bookingResponse.data.success);
    console.log('Message:', bookingResponse.data.message);
    console.log('Current Time in Response:', bookingResponse.data.current_time);
    console.log('Current Date in Response:', bookingResponse.data.current_date_utc);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testFixedDate();



