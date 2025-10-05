# Deployment Fixes for ElevenLabs Integration

## Summary of Changes

Your ElevenLabs integration was working on localhost but broke when deploying to Render because the tools were pointing to n8n webhooks that expected localhost URLs. We've fixed this by:

1. ✅ Updated backend to support both ElevenLabs format and standard API format
2. ✅ Added proper Google Calendar integration
3. ✅ Fixed CORS configuration (already done in Render)
4. ✅ Made endpoints compatible with your existing ElevenLabs tool configuration

## What You Need to Do Now

### Step 1: Deploy Updated Code to Render

1. Commit and push your changes to GitHub:
```bash
git add Server/index.js
git commit -m "Add ElevenLabs integration endpoints"
git push origin main
```

2. Render will automatically deploy the changes

### Step 2: Update Your ElevenLabs Tools

You have two tools that need URL updates:

#### Tool 1: Get_Available_Slots
**Current URL:** `https://mahmoudsahyoun.app.n8n.cloud/webhook/elevenlabs/call`
**New URL:** `https://answerlybyvaryonglobal.onrender.com/google/freebusy`
**Method:** Change from `POST` to `GET`
**Remove:** All body parameters (GET doesn't use body)
**Keep:** Query parameters if any

#### Tool 2: Book_meeting
**Current URL:** `https://mahmoudsahyoun.app.n8n.cloud/webhook/elevenlabs/call`
**New URL:** `https://answerlybyvaryonglobal.onrender.com/api/tools/create_meeting`
**Method:** Keep as `POST`
**Add Headers:**
- `Authorization: Bearer yib<Z!UJLJH)SpL-)5<s>Mj}u@x(w1`
- `Content-Type: application/json`

**Keep your existing body parameters:**
- `name` (required)
- `email` (required)
- `phone` (required)
- `date` (required)
- `time` (required)

The backend now supports these field names!

### Step 3: Test the Integration

1. Visit https://answerlyvoice.com
2. Click "Try AI Agent"
3. Test booking a meeting:
   - "I'd like to book a demo"
   - "I want to schedule a meeting"
   - "Can I book an appointment?"

4. The agent should:
   - Check availability using the first tool
   - Collect your information (name, email, phone, date, time)
   - Book the meeting using the second tool
   - Confirm with meeting details

### Step 4: Verify in Google Calendar

After testing, check your Google Calendar at `mahmoudsohyon123216@gmail.com` to see the created events with Google Meet links.

## Backend Changes Summary

### New Endpoints Added:

1. **POST /api/tools/create_meeting** (with auth)
   - Accepts ElevenLabs format: `name`, `email`, `phone`, `date`, `time`
   - Also accepts standard format: `full_name`, `email`, `start_iso`
   - Creates Google Calendar event with Meet link
   - Returns booking confirmation

2. **POST /api/book** (no auth - for website)
   - Same functionality as above
   - Used by your website booking form

3. **GET /google/freebusy** (no auth)
   - Returns available time slots
   - Checks Google Calendar for busy times
   - Returns slots in 30-minute increments
   - Mon-Fri, 8 AM - 5 PM Pacific Time

### Compatible With:

- ✅ Your existing ElevenLabs tool configuration
- ✅ Google Calendar service account
- ✅ Both localhost and production environments
- ✅ Your website booking form

## Environment Variables Required (Already Set in Render)

```
FRONTEND_ORIGIN=https://answerlyvoice.com
ELEVENLABS_TOOL_TOKEN=yib<Z!UJLJH)SpL-)5<s>Mj}u@x(w1
GOOGLE_SERVICE_ACCOUNT_EMAIL=final-answerl@answerly-final-version.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=<your-key>
GOOGLE_CALENDAR_ID=mahmoudsohyon123216@gmail.com
BOOKING_EMAIL=info@varyonglobal.com
BOOKING_TZ=America/Los_Angeles
BOOKING_LENGTH_MIN=60
BOOKING_BUFFER_MIN=30
```

## Testing Script

Run this to verify your endpoints are working:

```bash
cd Server
node ../test-elevenlabs-integration.js
```

## Troubleshooting

### Issue: "AI agent misconfigured" error
**Solution:** Update the ElevenLabs tool URLs as described above

### Issue: Authentication errors
**Solution:** Make sure the Authorization header is set in ElevenLabs Book_meeting tool

### Issue: Calendar events not creating
**Solution:** Verify Google Calendar credentials in Render environment variables

### Issue: Date/time parsing errors
**Solution:** The backend now handles multiple date formats, but ensure ElevenLabs is sending date and time

## Next Steps After Fixing

1. ✅ Test the voice agent booking flow
2. ✅ Test the website booking form
3. Monitor Render logs for any errors
4. Optionally: Add EmailJS integration for confirmation emails
5. Optionally: Remove n8n dependency if no longer needed

## Architecture

**Before (Localhost):**
```
ElevenLabs → n8n → localhost:3000 → Google Calendar
```

**After (Production):**
```
ElevenLabs → Render Backend → Google Calendar
                ↓
         (no n8n needed)
```

This is cleaner, faster, and more reliable!

