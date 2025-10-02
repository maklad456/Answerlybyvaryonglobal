# ElevenLabs Voice Agent Integration Setup

## Overview
Your server now supports both website bookings and ElevenLabs Voice Agent bookings through a shared booking system. The voice agent can book meetings, send confirmation emails, and create Teams meetings just like the website.

## Environment Variables Required

Add these to your `.env` file:

```env
# ElevenLabs Voice Agent Security
ELEVENLABS_TOOL_TOKEN=your-super-secret-token-here

# EmailJS Configuration (if not already set)
EMAILJS_SERVICE_ID=service_xxxxxxx
EMAILJS_TEMPLATE_USER=template_xxxxxxx
EMAILJS_TEMPLATE_INTERNAL=template_xxxxxxx
EMAILJS_PUBLIC_KEY=your-public-key-here
```

## API Endpoints

### 1. ElevenLabs Voice Agent Tool
**POST** `/api/tools/create_meeting`

**Headers:**
```
Authorization: Bearer your-super-secret-token-here
Content-Type: application/json
```

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "reason": "Consultation about AI receptionist",
  "start_iso": "2025-10-01T14:00:00Z",
  "duration_min": 30,
  "notes": "Interested in Answerly for their clinic"
}
```

**Response:**
```json
{
  "success": true,
  "meeting_link": "https://teams.microsoft.com/l/meetup-join/...",
  "calendar_link": "https://outlook.live.com/calendar/...",
  "start_time": "2025-10-01T14:00:00.000Z",
  "end_time": "2025-10-01T14:30:00.000Z",
  "subject": "Answerly Demo - John Doe",
  "message": "Meeting booked successfully for John Doe at Oct 1, 2025, 2:00 PM"
}
```

### 2. Public Website API
**POST** `/api/book`

**Request Body:** Same as ElevenLabs tool
**Response:** Same as ElevenLabs tool

## ElevenLabs Voice Agent Configuration

### 1. In ElevenLabs Dashboard
1. Go to your Voice Agent settings
2. Add a new "Tool" with these settings:

**Tool Type:** HTTP Request
**Method:** POST
**URL:** `https://yourdomain.com/api/tools/create_meeting`
**Headers:**
```
Authorization: Bearer your-super-secret-token-here
Content-Type: application/json
```

**Request Schema:**
```json
{
  "full_name": "string",
  "email": "string", 
  "phone": "string",
  "reason": "string",
  "start_iso": "string (ISO 8601 datetime)",
  "duration_min": "number (default: 30)",
  "notes": "string"
}
```

**Response Fields to Use:**
- `meeting_link` - Teams join URL
- `start_time` - Meeting start time
- `end_time` - Meeting end time
- `message` - Confirmation message to speak

### 2. Voice Agent Prompt Enhancement

Add this to your voice agent's system prompt:

```
When booking a meeting, collect:
1. Full name
2. Email address
3. Phone number (optional)
4. Reason for the meeting
5. Preferred date and time
6. Any additional notes

After collecting the information, call the booking tool and confirm the meeting details to the caller.

Example confirmation: "Perfect! I've booked your meeting for [start_time]. You'll receive a Teams link at [email] and a confirmation email shortly. The meeting is: [subject]"
```

## Security Features

1. **Bearer Token Authentication:** Only requests with the correct token can book meetings
2. **Input Validation:** All required fields are validated
3. **Error Handling:** Graceful error responses for debugging
4. **Source Tracking:** Bookings are tagged with source (voice_agent vs website)

## Testing

### Test the ElevenLabs Endpoint
```bash
# Set your token first
export ELEVENLABS_TOOL_TOKEN="your-secret-token"

# Test the endpoint
node test-elevenlabs.js
```

### Test the Public API
```bash
curl -X POST "http://localhost:3000/api/book" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "reason": "Test booking",
    "start_iso": "2025-10-01T10:00:00Z"
  }'
```

## What Happens When a Meeting is Booked

1. **Calendar Event Created:** Teams meeting added to info@varyonglobal.com calendar
2. **Confirmation Email:** Sent to the attendee with meeting details and Teams link
3. **Internal Notification:** Sent to info@varyonglobal.com with attendee details
4. **Response:** Voice agent receives confirmation with meeting details to speak back

## Troubleshooting

### Common Issues

1. **401 Unauthorized:** Check that `ELEVENLABS_TOOL_TOKEN` is set correctly
2. **Email Not Sending:** Verify EmailJS configuration and templates
3. **Calendar Not Updating:** Check Microsoft Graph permissions and authentication
4. **Timezone Issues:** All times should be in ISO 8601 format (UTC)

### Debug Mode

Check server logs for detailed error messages:
```bash
npm run dev
```

## Production Deployment

1. Set strong, unique `ELEVENLABS_TOOL_TOKEN`
2. Use HTTPS for all endpoints
3. Set up proper CORS for your domain
4. Monitor logs for failed bookings
5. Test both voice agent and website bookings

## Next Steps

1. Set up the environment variables
2. Configure your ElevenLabs Voice Agent with the tool
3. Test with a real voice call
4. Monitor the booking flow end-to-end
5. Customize email templates as needed



