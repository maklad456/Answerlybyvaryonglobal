// Test environment variables
require('dotenv').config();

console.log('🔍 Testing Environment Variables...\n');

console.log('✅ Microsoft Graph Variables:');
console.log('MS_GRAPH_TENANT_ID:', process.env.MS_GRAPH_TENANT_ID ? 'Present' : 'Missing');
console.log('MS_GRAPH_CLIENT_ID:', process.env.MS_GRAPH_CLIENT_ID ? 'Present' : 'Missing');
console.log('MS_GRAPH_CLIENT_SECRET:', process.env.MS_GRAPH_CLIENT_SECRET ? 'Present' : 'Missing');

console.log('\n✅ Booking Variables:');
console.log('BOOKING_EMAIL:', process.env.BOOKING_EMAIL ? 'Present' : 'Missing');
console.log('BOOKING_TZ:', process.env.BOOKING_TZ ? 'Present' : 'Missing');

console.log('\n✅ ElevenLabs Variables:');
console.log('ELEVENLABS_TOOL_TOKEN:', process.env.ELEVENLABS_TOOL_TOKEN ? 'Present' : 'Missing');

console.log('\n❌ EmailJS Variables (These are missing!):');
console.log('EMAILJS_SERVICE_ID:', process.env.EMAILJS_SERVICE_ID ? 'Present' : 'Missing');
console.log('EMAILJS_TEMPLATE_USER:', process.env.EMAILJS_TEMPLATE_USER ? 'Present' : 'Missing');
console.log('EMAILJS_TEMPLATE_INTERNAL:', process.env.EMAILJS_TEMPLATE_INTERNAL ? 'Present' : 'Missing');
console.log('EMAILJS_PUBLIC_KEY:', process.env.EMAILJS_PUBLIC_KEY ? 'Present' : 'Missing');

console.log('\n📧 EmailJS Configuration Status:');
const hasEmailJS = process.env.EMAILJS_SERVICE_ID && 
                   process.env.EMAILJS_TEMPLATE_USER && 
                   process.env.EMAILJS_PUBLIC_KEY;
console.log('EmailJS Fully Configured:', hasEmailJS ? '✅ Yes' : '❌ No');

if (!hasEmailJS) {
  console.log('\n🔧 To fix email sending, add these to your Server/.env file:');
  console.log('EMAILJS_SERVICE_ID=your_service_id');
  console.log('EMAILJS_TEMPLATE_USER=your_user_template_id');
  console.log('EMAILJS_TEMPLATE_INTERNAL=your_internal_template_id');
  console.log('EMAILJS_PUBLIC_KEY=your_public_key');
}



