// Test what the actual current date is
console.log('🔍 Testing Actual Current Date...\n');

// Test 1: Basic Date
console.log('1️⃣ Basic Date:');
const now = new Date();
console.log('new Date():', now);
console.log('now.toISOString():', now.toISOString());
console.log('now.getTime():', now.getTime());

// Test 2: Pacific Time
console.log('\n2️⃣ Pacific Time:');
const pacificTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
console.log('Pacific Time Object:', pacificTime);
console.log('Pacific Time ISO:', pacificTime.toISOString());
console.log('Pacific Time String:', pacificTime.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
console.log('Pacific Date:', pacificTime.toLocaleDateString("en-US", {timeZone: "America/Los_Angeles"}));
console.log('Pacific Day:', pacificTime.toLocaleDateString("en-US", {timeZone: "America/Los_Angeles", weekday: 'long'}));

// Test 3: UTC Time
console.log('\n3️⃣ UTC Time:');
console.log('UTC Time:', now.toISOString());
console.log('UTC Date:', now.toLocaleDateString("en-US", {timeZone: "UTC"}));
console.log('UTC Day:', now.toLocaleDateString("en-US", {timeZone: "UTC", weekday: 'long'}));

// Test 4: Local Time
console.log('\n4️⃣ Local Time:');
console.log('Local Time:', now.toLocaleString());
console.log('Local Date:', now.toLocaleDateString());
console.log('Local Day:', now.toLocaleDateString("en-US", {weekday: 'long'}));

// Test 5: Check if there's a timezone issue
console.log('\n5️⃣ Timezone Check:');
console.log('Timezone Offset:', now.getTimezoneOffset());
console.log('Date.getTimezoneOffset():', new Date().getTimezoneOffset());



