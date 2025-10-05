// Test script for ElevenLabs integration
const axios = require('axios');

const API_BASE = 'https://answerlybyvaryonglobal.onrender.com';
const ELEVENLABS_TOKEN = 'yib<Z!UJLJH)SpL-)5<s>Mj}u@x(w1';

async function testElevenLabsIntegration() {
  console.log('🧪 Testing ElevenLabs Integration...\n');

  // Test 1: Health check
  console.log('1️⃣ Testing health check...');
  try {
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return;
  }

  // Test 2: ElevenLabs endpoint (without auth - should fail)
  console.log('\n2️⃣ Testing ElevenLabs endpoint without auth...');
  try {
    const response = await axios.post(`${API_BASE}/api/tools/create_meeting`, {
      full_name: 'Test User',
      email: 'test@example.com',
      start_iso: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
    console.log('❌ Should have failed but got:', response.data);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Auth required (expected):', error.response.data);
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }

  // Test 3: ElevenLabs endpoint (with auth)
  console.log('\n3️⃣ Testing ElevenLabs endpoint with auth...');
  try {
    const response = await axios.post(`${API_BASE}/api/tools/create_meeting`, {
      full_name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      reason: 'AI receptionist consultation',
      start_iso: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration_min: 30,
      notes: 'Test booking from ElevenLabs integration'
    }, {
      headers: {
        'Authorization': `Bearer ${ELEVENLABS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ ElevenLabs booking successful:', response.data);
  } catch (error) {
    console.log('❌ ElevenLabs booking failed:', error.response?.data || error.message);
  }

  // Test 4: Google Calendar availability
  console.log('\n4️⃣ Testing Google Calendar availability...');
  try {
    const response = await axios.get(`${API_BASE}/google/freebusy`);
    console.log('✅ Google Calendar availability:', {
      offers: response.data.offers?.length || 0,
      busySlots: response.data.busySlots?.length || 0
    });
  } catch (error) {
    console.log('❌ Google Calendar availability failed:', error.response?.data || error.message);
  }

  // Test 5: Website booking endpoint
  console.log('\n5️⃣ Testing website booking endpoint...');
  try {
    const response = await axios.post(`${API_BASE}/api/book`, {
      full_name: 'Website Test User',
      email: 'test@example.com',
      start_iso: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      duration_min: 30
    });
    console.log('✅ Website booking successful:', response.data);
  } catch (error) {
    console.log('❌ Website booking failed:', error.response?.data || error.message);
  }

  console.log('\n🎯 Integration test completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Configure your ElevenLabs agent with the tool settings above');
  console.log('2. Test the voice agent on your website');
  console.log('3. Check your Google Calendar for created events');
}

// Run the test
testElevenLabsIntegration().catch(console.error);
