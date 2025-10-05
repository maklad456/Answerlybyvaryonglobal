// Microsoft Calendar Integration Server
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const { PublicClientApplication } = require('@azure/msal-node');
const { DateTime, Interval } = require('luxon');
const { google } = require('googleapis');

const app = express();

// Config
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:8000';

// Microsoft Graph credentials
const {
  MS_GRAPH_CLIENT_ID,
  MS_GRAPH_CLIENT_SECRET,
  MS_GRAPH_TENANT_ID,
  MS_GRAPH_REDIRECT_URI,
  BOOKING_EMAIL,
  BOOKING_TZ,
  BOOKING_LENGTH_MIN,
  BOOKING_BUFFER_MIN,
  BOOKING_WORK_HOURS,
  SYNTHETIC_BUSY,
  ELEVENLABS_TOOL_TOKEN,
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  GOOGLE_CALENDAR_ID,
} = process.env;

// Middleware
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Health check
app.get('/health', (_req, res) => {
  console.log('Health check called!');
  res.json({ ok: true });
});

// Test route
app.get('/test', (_req, res) => res.json({ message: 'Server is working!' }));

// ===== Microsoft OAuth (Delegated) =====
const OAUTH_SCOPES = [
  'openid',
  'profile',
  'offline_access',
  'User.Read',
  'Calendars.ReadWrite',
];

const msalConfig = {
  auth: {
    clientId: MS_GRAPH_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${MS_GRAPH_TENANT_ID}`,
  },
};

const msalClient = new PublicClientApplication(msalConfig);

// Store tokens in-memory for demo
let msAuth = {
  accessToken: null,
  expiresAt: 0,
};

app.get('/ms/oauth/start', async (req, res) => {
  console.log('OAuth start route called');
  try {
    console.log('Creating auth URL...');
    const authUrl = await msalClient.getAuthCodeUrl({
      scopes: OAUTH_SCOPES,
      redirectUri: MS_GRAPH_REDIRECT_URI,
      prompt: 'select_account',
    });
    console.log('Auth URL created:', authUrl);
    res.redirect(authUrl);
  } catch (e) {
    console.error('OAuth error:', e);
    res.status(500).send('Failed to create auth URL: ' + e.message);
  }
});

app.get('/ms/oauth/callback', async (req, res) => {
  try {
    const tokenResponse = await msalClient.acquireTokenByCode({
      code: req.query.code,
      scopes: OAUTH_SCOPES,
      redirectUri: MS_GRAPH_REDIRECT_URI,
    });
    msAuth.accessToken = tokenResponse.accessToken;
    msAuth.expiresAt = Date.now() + (tokenResponse.expiresIn * 1000 - 60000);
    res.send('Microsoft authorization complete. You can close this tab.');
  } catch (e) {
    console.error('OAuth callback error:', e);
    res.status(500).send(`Authorization failed: ${e.message}`);
  }
});

function requireMsAuth(req, res, next) {
  console.log('requireMsAuth called, token exists:', !!msAuth.accessToken, 'expires at:', msAuth.expiresAt);
  if (!msAuth.accessToken || Date.now() > msAuth.expiresAt) {
    console.log('Auth failed, returning 401');
    return res.status(401).json({ error: 'Microsoft auth required. Visit /ms/oauth/start' });
  }
  console.log('Auth passed, calling next()');
  next();
}

// Utilities for schedule
function parseWorkHours(str) {
  // Example: "Mon-Fri 09:00-17:00"
  const match = str.match(/(\w+)-(\w+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})/);
  if (!match) return { days: ['Mon','Tue','Wed','Thu','Fri'], start: '08:00', end: '17:00' };
  const dayMap = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const startDay = match[1];
  const endDay = match[2];
  const startIdx = dayMap.indexOf(startDay);
  const endIdx = dayMap.indexOf(endDay);
  const days = [];
  for (let i = startIdx; i !== (endIdx + 1) % 7; i = (i + 1) % 7) {
    days.push(dayMap[i]);
    if (i === endIdx) break;
  }
  return { days, start: match[3], end: match[4] };
}

function toIsoWithTZ(date) {
  return date.toISOString();
}

function dayKeyInTimeZone(date, tz) {
  return DateTime.fromJSDate(date).setZone(tz).toFormat('yyyy-LL-dd');
}

function tzDayBounds(baseDate, tz, sh, sm, eh, em) {
  const dt = DateTime.fromJSDate(baseDate).setZone(tz);
  const start = dt.set({ hour: sh, minute: sm, second: 0, millisecond: 0 });
  const end = dt.set({ hour: eh, minute: em, second: 0, millisecond: 0 });
  return { startUTC: start.toUTC().toJSDate(), endUTC: end.toUTC().toJSDate() };
}

function isWithinWindowLuxon(startDate, endDate, tz, sh, eh) {
  const s = DateTime.fromJSDate(startDate).setZone(tz);
  const e = DateTime.fromJSDate(endDate).setZone(tz);
  const sameDay = s.toFormat('yyyy-LL-dd') === e.toFormat('yyyy-LL-dd');
  return sameDay && s.hour >= sh && e.hour <= eh && e > s;
}

app.get('/ms/freebusy', requireMsAuth, async (req, res) => {
  console.log('Freebusy endpoint called!');
  try {
    const tz = BOOKING_TZ || 'America/Los_Angeles';
    const slotMin = parseInt(BOOKING_LENGTH_MIN || '60', 10);
    const bufferMin = parseInt(BOOKING_BUFFER_MIN || '30', 10);
    // Enforce Mon-Fri 08:00-17:00 as requested
    const work = parseWorkHours('Mon-Fri 08:00-17:00');

    // Compute window strictly in Pacific time
    const nowPac = DateTime.now().setZone(tz);
    const startPac = nowPac.plus({ days: 1 }).startOf('day');
    const endPac = nowPac.plus({ days: 14 }).endOf('day');
    const now = nowPac.toUTC().toJSDate();
    const startDate = startPac.toUTC().toJSDate();
    const end = endPac.toUTC().toJSDate();

    const payload = {
      schedules: [BOOKING_EMAIL],
      startTime: { dateTime: toIsoWithTZ(startDate), timeZone: tz },
      endTime: { dateTime: toIsoWithTZ(end), timeZone: tz },
      availabilityViewInterval: 30,
    };

    const resp = await axios.post(
      'https://graph.microsoft.com/v1.0/me/calendar/getSchedule',
      payload,
      { headers: { Authorization: `Bearer ${msAuth.accessToken}`, 'Content-Type': 'application/json' } }
    );

    const schedule = resp.data.value && resp.data.value[0];
    const busy = (schedule && schedule.scheduleItems) || [];

    // Group busy times by day
    const busyByDay = new Map();
    busy.forEach(b => {
      const start = new Date(b.start.dateTime);
      const end = new Date(b.end.dateTime);
      const dayKey = dayKeyInTimeZone(start, tz);
      if (!busyByDay.has(dayKey)) {
        busyByDay.set(dayKey, []);
      }
      busyByDay.get(dayKey).push({ start, end });
    });

    // Check and add synthetic busy slots for next 3 days (Pacific-aware)
    console.log('Checking days for synthetic busy slots (Pacific)...');
    const syntheticSlotsToAdd = [];
    let synthCursor = DateTime.fromJSDate(startDate).setZone(tz).startOf('day');
    const synthEnd = DateTime.fromJSDate(end).setZone(tz).endOf('day');
    const nowPacStart = DateTime.fromJSDate(now).setZone(tz).startOf('day');
    const [shW, smW] = work.start.split(':').map(Number);
    const [ehW, emW] = work.end.split(':').map(Number);

    while (synthCursor < synthEnd) {
      const dayKey = synthCursor.toFormat('yyyy-LL-dd');
      const dayName = synthCursor.toFormat('ccc');
      const daysFromNow = Math.round(synthCursor.diff(nowPacStart, 'days').days);

      console.log(`Day: ${dayKey}, Name: ${dayName}, DaysFromNow: ${daysFromNow}, HasExistingBusy: ${busyByDay.has(dayKey)}`);

      if (work.days.includes(dayName) && daysFromNow >= 1 && daysFromNow <= 3) {
        const existingBusy = busyByDay.get(dayKey) || [];
        const existingHours = existingBusy.length; // 1-hour slots

        let requiredHours;
        if (daysFromNow === 1) requiredHours = 4;
        else if (daysFromNow === 2) requiredHours = 3;
        else requiredHours = 2;

        if (existingHours < requiredHours) {
          const hoursToAdd = requiredHours - existingHours;
          const dayStartPac = synthCursor.set({ hour: shW, minute: smW, second: 0, millisecond: 0 });
          const dayEndPac = synthCursor.set({ hour: ehW, minute: emW, second: 0, millisecond: 0 });

          // Build possible 1-hour slots stepping 30 minutes in Pacific
          const possibleSlots = [];
          let c = dayStartPac;
          while (c.plus({ hours: 1 }) <= dayEndPac) {
            possibleSlots.push(c);
            c = c.plus({ minutes: 30 });
          }

          const selectedSlots = [];
          for (let i = 0; i < hoursToAdd && possibleSlots.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * possibleSlots.length);
            const startPac = possibleSlots.splice(randomIndex, 1)[0];
            const endPac = startPac.plus({ hours: 1 });
            const slotStart = startPac.toUTC().toJSDate();
            const slotEnd = endPac.toUTC().toJSDate();
            selectedSlots.push({ start: slotStart, end: slotEnd });
            syntheticSlotsToAdd.push({ start: slotStart, end: slotEnd, dayKey });
          }

          const existingSlots = busyByDay.get(dayKey) || [];
          busyByDay.set(dayKey, [...existingSlots, ...selectedSlots]);
        }
      }

      synthCursor = synthCursor.plus({ days: 1 });
    }
    
    // Add synthetic slots to Microsoft Calendar
    if (syntheticSlotsToAdd.length > 0) {
      console.log(`Adding ${syntheticSlotsToAdd.length} synthetic slots to calendar...`);
      for (const slot of syntheticSlotsToAdd) {
        try {
          const event = {
            subject: 'Busy - Internal',
            start: { dateTime: slot.start.toISOString(), timeZone: tz },
            end: { dateTime: slot.end.toISOString(), timeZone: tz },
            isAllDay: false,
            showAs: 'busy'
          };
          
          await axios.post(
            'https://graph.microsoft.com/v1.0/me/events',
            event,
            { headers: { Authorization: `Bearer ${msAuth.accessToken}`, 'Content-Type': 'application/json' } }
          );
          console.log(`Added synthetic slot: ${slot.start.toISOString()}`);
        } catch (e) {
          console.error('Failed to add synthetic slot:', e.message);
        }
      }
    }

    // Build all slots (available and busy) within work hours (starting from tomorrow)
    const offers = [];
    const busySlots = [];
    let cursorDt = DateTime.fromJSDate(startDate).setZone(tz).startOf('day');
    const endDt = DateTime.fromJSDate(end).setZone(tz).endOf('day');
    while (cursorDt < endDt) {
      const day = cursorDt.toFormat('ccc'); // Mon, Tue, ... in current locale
      if (work.days.includes(day)) {
        const [sh, sm] = work.start.split(':').map(Number);
        const [eh, em] = work.end.split(':').map(Number);
        const { startUTC: dayStart, endUTC: dayEnd } = tzDayBounds(cursorDt.toJSDate(), tz, sh, sm, eh, em);
        let slotStart = new Date(dayStart);
        
        const dayKey = dayKeyInTimeZone(cursorDt.toJSDate(), tz);
        const dayBusy = busyByDay.get(dayKey) || [];
        
        while (new Date(slotStart.getTime() + slotMin * 60000) <= dayEnd) {
          const slotEnd = new Date(slotStart.getTime() + slotMin * 60000);
          const paddedStart = new Date(slotStart.getTime() - bufferMin * 60000);
          const paddedEnd = new Date(slotEnd.getTime() + bufferMin * 60000);
          
          // Enforce 08:00–17:00 in the booking timezone (Luxon)
          const withinWindow = isWithinWindowLuxon(slotStart, slotEnd, tz, 8, 17);
          if (!withinWindow) {
            slotStart = new Date(slotStart.getTime() + 30 * 60000);
            continue;
          }

          const overlaps = dayBusy.some(b => {
            return paddedStart < b.end && paddedEnd > b.start;
          });
          
          const slotData = { 
            start: slotStart.toISOString(), 
            end: slotEnd.toISOString(), 
            tz,
            available: !overlaps 
          };
          
          if (overlaps) {
            busySlots.push(slotData);
          } else {
            offers.push(slotData);
          }
          
          slotStart = new Date(slotStart.getTime() + 30 * 60000); // step 30m
        }
      }
      cursorDt = cursorDt.plus({ days: 1 });
    }

    res.json({ offers, busySlots });
  } catch (e) {
    res.status(500).json({ error: 'freebusy_failed', details: e.message });
  }
});

app.post('/ms/book', requireMsAuth, async (req, res) => {
  try {
    const { startIso, endIso, subject = 'Answerly Demo', attendeeEmail, attendeeName } = req.body || {};

    // 1) Server-side conflict check to prevent double booking
    try {
      const viewUrl = `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${encodeURIComponent(startIso)}&endDateTime=${encodeURIComponent(endIso)}&$top=1`;
      const view = await axios.get(viewUrl, {
        headers: {
          Authorization: `Bearer ${msAuth.accessToken}`,
          'Content-Type': 'application/json',
          Prefer: `outlook.timezone="${BOOKING_TZ || 'America/Los_Angeles'}"`
        }
      });
      const overlapping = (view.data && Array.isArray(view.data.value) && view.data.value.length > 0);
      if (overlapping) {
        return res.status(409).json({ ok: false, conflict: true, message: 'Selected time is no longer available.' });
      }
    } catch (confErr) {
      // If the conflict check fails unexpectedly, be conservative and continue to booking to avoid blocking flow
      console.warn('Conflict check failed, proceeding to create event:', confErr.message);
    }
    const body = {
      subject,
      start: { dateTime: startIso, timeZone: BOOKING_TZ || 'America/Los_Angeles' },
      end: { dateTime: endIso, timeZone: BOOKING_TZ || 'America/Los_Angeles' },
      attendees: attendeeEmail ? [{
        emailAddress: { address: attendeeEmail, name: attendeeName || attendeeEmail },
        type: 'required',
      }] : [],
      allowNewTimeProposals: true,
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness',
      body: { contentType: 'HTML', content: 'Scheduled by Answerly AI.' },
    };
    const resp = await axios.post(
      'https://graph.microsoft.com/v1.0/me/events',
      body,
      { headers: { Authorization: `Bearer ${msAuth.accessToken}`, 'Content-Type': 'application/json' } }
    );
    const created = resp.data || {};
    const joinUrl = created.onlineMeeting && created.onlineMeeting.joinUrl;

    // If we received a Teams join URL, update the event body to include a styled CTA
    if (joinUrl && created.id) {
      const html = `
        <div style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a">
          <h2 style="margin:0 0 12px">Answerly by Varyon — Demo Call</h2>
          <p>Your meeting is confirmed. Click the button below to join on Microsoft Teams.</p>
          <p>
            <a href="${joinUrl}" style="display:inline-block;background:#1a73e8;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Join Microsoft Teams</a>
          </p>
          <p style="margin-top:16px;font-size:12px;color:#475569">If the button doesn’t work, copy this link: ${joinUrl}</p>
        </div>`;
      try {
        await axios.patch(
          `https://graph.microsoft.com/v1.0/me/events/${created.id}`,
          { body: { contentType: 'HTML', content: html } },
          { headers: { Authorization: `Bearer ${msAuth.accessToken}`, 'Content-Type': 'application/json' } }
        );
      } catch (_) { /* best-effort update */ }
    }

    res.json({ ok: true, eventId: created.id, joinUrl });
  } catch (e) {
    res.status(500).json({ error: 'booking_failed', details: e.message });
  }
});

// Danger: Clear events helper - defaults to only removing events created by this app
// Use scope=all to remove all events within the window
app.post('/ms/clear', requireMsAuth, async (req, res) => {
  try {
    const tz = BOOKING_TZ || 'America/Los_Angeles';
    const now = new Date();
    const scope = (req.query.scope || 'ours').toString();
    const subjectFilter = (req.query.subject || '').toString();
    // Range: allow custom start/end; default is 30 days back to 60 days ahead
    const startIso = req.query.start || new Date(now.getTime() - 30 * 86400000).toISOString();
    const endIso = req.query.end || new Date(now.getTime() + 60 * 86400000).toISOString();

  const headers = { Authorization: `Bearer ${msAuth.accessToken}`, 'Content-Type': 'application/json', Prefer: `outlook.timezone="${tz}"` };
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    return res.status(400).json({ error: 'clear_failed', details: 'Invalid start/end range' });
  }

  // Fetch in 30-day chunks to avoid Graph 400 on large windows
  const events = [];
  let windowStart = new Date(start);
  while (windowStart < end) {
    const windowEnd = new Date(Math.min(end.getTime(), windowStart.getTime() + 30 * 24 * 60 * 60 * 1000));
    const url = `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${encodeURIComponent(windowStart.toISOString())}&endDateTime=${encodeURIComponent(windowEnd.toISOString())}&$top=1000`;
    try {
      const resp = await axios.get(url, { headers });
      if (Array.isArray(resp.data?.value)) events.push(...resp.data.value);
    } catch (err) {
      return res.status(500).json({ error: 'clear_failed', details: `Fetch failed for window ${windowStart.toISOString()} - ${windowEnd.toISOString()}: ${err.message}` });
    }
    windowStart = new Date(windowEnd.getTime() + 1);
  }

    const toDelete = events.filter(ev => {
      if (scope === 'all') return true;
      const subject = (ev.subject || '').toLowerCase();
      if (subjectFilter) return subject.includes(subjectFilter.toLowerCase());
      return subject.includes('busy - internal') || subject.includes('answerly demo');
    });

    let deleted = 0, failed = 0;
    for (const ev of toDelete) {
      try {
        await axios.delete(`https://graph.microsoft.com/v1.0/me/events/${ev.id}`, { headers });
        deleted += 1;
      } catch (_) { failed += 1; }
    }
    res.json({ ok: true, total: events.length, deleted, failed, scope, startIso, endIso, filteredBy: subjectFilter || 'default_app_subjects' });
  } catch (e) {
    res.status(500).json({ error: 'clear_failed', details: e.message });
  }
});

// ===== ElevenLabs Integration =====

// Google Calendar setup for ElevenLabs
let googleAuth = null;
let googleCalendar = null;

function initializeGoogleAuth() {
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_CALENDAR_ID) {
    console.warn('Google Calendar credentials not configured for ElevenLabs integration');
    return false;
  }

  try {
    // Clean up the private key - handle various formats
    let privateKey = GOOGLE_PRIVATE_KEY;
    
    // Remove quotes if present
    privateKey = privateKey.replace(/^["']|["']$/g, '');
    
    // Replace escaped newlines with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    // Ensure proper formatting
    if (!privateKey.includes('\n')) {
      // If no newlines at all, it might be a single-line format
      console.error('Private key appears to be in wrong format (no newlines)');
    }
    
    const credentials = {
      client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    };

    googleAuth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    googleCalendar = google.calendar({ version: 'v3', auth: googleAuth });
    console.log('Google Calendar initialized for ElevenLabs integration');
    return true;
  } catch (error) {
    console.error('Failed to initialize Google Calendar:', error);
    console.error('Private key length:', GOOGLE_PRIVATE_KEY?.length);
    console.error('Has newlines:', GOOGLE_PRIVATE_KEY?.includes('\\n') || GOOGLE_PRIVATE_KEY?.includes('\n'));
    return false;
  }
}

// Initialize Google Auth on startup
initializeGoogleAuth();

// ElevenLabs authentication middleware
function requireElevenLabsAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token !== ELEVENLABS_TOOL_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing ElevenLabs token' });
  }
  next();
}

// ElevenLabs Voice Agent Tool Endpoint
app.post('/api/tools/create_meeting', requireElevenLabsAuth, async (req, res) => {
  try {
    // Support both formats: new format (full_name, start_iso) and ElevenLabs format (name, date, time)
    let full_name = req.body.full_name || req.body.name;
    let email = req.body.email;
    let phone = req.body.phone;
    let reason = req.body.reason || 'Demo consultation';
    let duration_min = req.body.duration_min || 30;
    let notes = req.body.notes || '';
    let startTime;

    // Handle date/time format from ElevenLabs
    if (req.body.date && req.body.time) {
      // ElevenLabs format: separate date and time fields
      const dateStr = req.body.date; // e.g., "2024-01-15" or "January 15, 2024"
      const timeStr = req.body.time; // e.g., "14:00" or "2:00 PM"
      
      // Try to parse the date and time
      const combinedStr = `${dateStr} ${timeStr}`;
      startTime = new Date(combinedStr);
      
      // If parsing failed, try ISO format
      if (isNaN(startTime.getTime()) && req.body.start_iso) {
        startTime = new Date(req.body.start_iso);
      }
    } else if (req.body.start_iso) {
      // Direct ISO format
      startTime = new Date(req.body.start_iso);
    }

    // Validate required fields
    if (!full_name || !email || !startTime || isNaN(startTime.getTime())) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'name/full_name, email, and date/time or start_iso are required',
        received: req.body
      });
    }

    const endTime = new Date(startTime.getTime() + (duration_min * 60000));

    let meetingLink = '';
    let calendarLink = '';

    // Create Google Calendar event if configured
    if (googleCalendar) {
      try {
        const event = {
          summary: `Answerly Demo - ${full_name}`,
          description: `Demo consultation with ${full_name}\nReason: ${reason || 'AI receptionist consultation'}\nPhone: ${phone || 'Not provided'}\nNotes: ${notes || 'None'}`,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: BOOKING_TZ || 'America/Los_Angeles',
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: BOOKING_TZ || 'America/Los_Angeles',
          },
          attendees: [
            {
              email: email,
              displayName: full_name,
            },
            {
              email: BOOKING_EMAIL || 'info@varyonglobal.com',
              displayName: 'Answerly by Varyon',
            },
          ],
          conferenceData: {
            createRequest: {
              requestId: `answerly-${Date.now()}`,
              conferenceSolutionKey: {
                type: 'hangoutsMeet',
              },
            },
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 },
              { method: 'popup', minutes: 10 },
            ],
          },
        };

        const response = await googleCalendar.events.insert({
          calendarId: GOOGLE_CALENDAR_ID,
          resource: event,
          conferenceDataVersion: 1,
        });

        meetingLink = response.data.conferenceData?.entryPoints?.[0]?.uri || '';
        calendarLink = response.data.htmlLink || '';

        console.log(`Google Calendar event created: ${response.data.id}`);
      } catch (error) {
        console.error('Failed to create Google Calendar event:', error);
        // Continue without calendar integration
      }
    }

    // Send confirmation email (placeholder - you can integrate EmailJS here)
    const emailData = {
      to: email,
      subject: `Answerly Demo Confirmation - ${full_name}`,
      body: `
        Hello ${full_name},
        
        Your demo consultation with Answerly by Varyon is confirmed for:
        
        Date: ${startTime.toLocaleDateString()}
        Time: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}
        Duration: ${duration_min} minutes
        
        ${meetingLink ? `Join Meeting: ${meetingLink}` : ''}
        ${calendarLink ? `View in Calendar: ${calendarLink}` : ''}
        
        If you need to reschedule, please contact us at ${BOOKING_EMAIL || 'info@varyonglobal.com'}.
        
        Best regards,
        Answerly by Varyon Team
      `,
    };

    // Format response for ElevenLabs
    const response = {
      success: true,
      meeting_link: meetingLink,
      calendar_link: calendarLink,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      subject: `Answerly Demo - ${full_name}`,
      message: `Meeting booked successfully for ${full_name} at ${startTime.toLocaleDateString()}, ${startTime.toLocaleTimeString()}. ${meetingLink ? 'A meeting link has been provided.' : 'You will receive a confirmation email shortly.'}`,
      attendee_email: email,
      attendee_name: full_name,
    };

    console.log('ElevenLabs booking completed:', response);
    res.json(response);

  } catch (error) {
    console.error('ElevenLabs booking error:', error);
    res.status(500).json({
      error: 'booking_failed',
      message: error.message || 'Failed to create meeting',
      details: error.toString()
    });
  }
});

// Public Website Booking Endpoint (same functionality as ElevenLabs)
app.post('/api/book', async (req, res) => {
  try {
    const { full_name, email, phone, reason, start_iso, duration_min = 30, notes } = req.body;

    // Validate required fields
    if (!full_name || !email || !start_iso) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'full_name, email, and start_iso are required'
      });
    }

    const startTime = new Date(start_iso);
    const endTime = new Date(startTime.getTime() + (duration_min * 60000));

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'start_iso must be a valid ISO 8601 datetime'
      });
    }

    let meetingLink = '';
    let calendarLink = '';

    // Create Google Calendar event if configured
    if (googleCalendar) {
      try {
        const event = {
          summary: `Answerly Demo - ${full_name}`,
          description: `Demo consultation with ${full_name}\nReason: ${reason || 'AI receptionist consultation'}\nPhone: ${phone || 'Not provided'}\nNotes: ${notes || 'None'}`,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: BOOKING_TZ || 'America/Los_Angeles',
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: BOOKING_TZ || 'America/Los_Angeles',
          },
          attendees: [
            {
              email: email,
              displayName: full_name,
            },
            {
              email: BOOKING_EMAIL || 'info@varyonglobal.com',
              displayName: 'Answerly by Varyon',
            },
          ],
          conferenceData: {
            createRequest: {
              requestId: `answerly-${Date.now()}`,
              conferenceSolutionKey: {
                type: 'hangoutsMeet',
              },
            },
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 },
              { method: 'popup', minutes: 10 },
            ],
          },
        };

        const response = await googleCalendar.events.insert({
          calendarId: GOOGLE_CALENDAR_ID,
          resource: event,
          conferenceDataVersion: 1,
        });

        meetingLink = response.data.conferenceData?.entryPoints?.[0]?.uri || '';
        calendarLink = response.data.htmlLink || '';

        console.log(`Google Calendar event created: ${response.data.id}`);
      } catch (error) {
        console.error('Failed to create Google Calendar event:', error);
        // Continue without calendar integration
      }
    }

    // Format response
    const response = {
      success: true,
      meeting_link: meetingLink,
      calendar_link: calendarLink,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      subject: `Answerly Demo - ${full_name}`,
      message: `Meeting booked successfully for ${full_name} at ${startTime.toLocaleDateString()}, ${startTime.toLocaleTimeString()}. ${meetingLink ? 'A meeting link has been provided.' : 'You will receive a confirmation email shortly.'}`,
      attendee_email: email,
      attendee_name: full_name,
    };

    console.log('Website booking completed:', response);
    res.json(response);

  } catch (error) {
    console.error('Website booking error:', error);
    res.status(500).json({
      error: 'booking_failed',
      message: error.message || 'Failed to create meeting',
      details: error.toString()
    });
  }
});

// Google Calendar booking endpoint (same as /api/book but at /google/book for compatibility)
app.post('/google/book', async (req, res) => {
  try {
    const { full_name, email, phone, reason, start_iso, duration_min = 30, notes } = req.body;

    // Validate required fields
    if (!full_name || !email || !start_iso) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'full_name, email, and start_iso are required'
      });
    }

    const startTime = new Date(start_iso);
    const endTime = new Date(startTime.getTime() + (duration_min * 60000));

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'start_iso must be a valid ISO 8601 datetime'
      });
    }

    let meetingLink = '';
    let calendarLink = '';

    // Create Google Calendar event if configured
    if (googleCalendar) {
      try {
        const event = {
          summary: `Answerly Demo - ${full_name}`,
          description: `Demo consultation with ${full_name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nReason: ${reason || 'AI receptionist consultation'}\nNotes: ${notes || 'None'}\n\nPlease manually send calendar invite to: ${email}`,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: BOOKING_TZ || 'America/Los_Angeles',
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: BOOKING_TZ || 'America/Los_Angeles',
          },
          // Note: Not adding attendees or conference data because service account requires additional permissions
          // The EmailJS integration will handle sending notifications to the attendee
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 },
              { method: 'popup', minutes: 10 },
            ],
          },
        };

        const response = await googleCalendar.events.insert({
          calendarId: GOOGLE_CALENDAR_ID,
          resource: event,
        });

        meetingLink = ''; // No meeting link without conference data
        calendarLink = response.data.htmlLink || '';

        console.log(`Google Calendar event created via /google/book: ${response.data.id}`);
      } catch (error) {
        console.error('Failed to create Google Calendar event:', error);
        return res.status(500).json({
          error: 'calendar_booking_failed',
          message: error.message || 'Failed to create calendar event'
        });
      }
    } else {
      return res.status(500).json({
        error: 'calendar_not_configured',
        message: 'Google Calendar integration is not available'
      });
    }

    // Format response
    const response = {
      success: true,
      join_url: meetingLink,
      meeting_link: meetingLink,
      calendar_link: calendarLink,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      subject: `Answerly Demo - ${full_name}`,
      message: `Meeting booked successfully for ${full_name}`,
      attendee_email: email,
      attendee_name: full_name,
    };

    console.log('Website booking completed via /google/book:', response);
    res.json(response);

  } catch (error) {
    console.error('Website booking error:', error);
    res.status(500).json({
      error: 'booking_failed',
      message: error.message || 'Failed to create meeting',
      details: error.toString()
    });
  }
});

// Google Calendar availability endpoint for ElevenLabs (public endpoint - no auth required)
app.get('/google/freebusy', async (req, res) => {
  try {
    if (!googleCalendar) {
      return res.status(500).json({
        error: 'Google Calendar not configured',
        message: 'Google Calendar integration is not available'
      });
    }

    const tz = BOOKING_TZ || 'America/Los_Angeles';
    const slotMin = parseInt(BOOKING_LENGTH_MIN || '30', 10);
    const bufferMin = parseInt(BOOKING_BUFFER_MIN || '30', 10);

    // Get busy times for the next 14 days
    const now = new Date();
    const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now

    const response = await googleCalendar.freebusy.query({
      resource: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: [{ id: GOOGLE_CALENDAR_ID }],
        timeZone: tz,
      },
    });

    const busySlots = response.data.calendars[GOOGLE_CALENDAR_ID]?.busy || [];
    const offers = [];

    // Generate available time slots (simplified version)
    // This is a basic implementation - you can enhance it based on your needs
    const workDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const workStart = 8; // 8 AM
    const workEnd = 17; // 5 PM

    for (let day = 1; day <= 14; day++) {
      const date = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      if (workDays.includes(dayName)) {
        for (let hour = workStart; hour < workEnd; hour++) {
          const slotStart = new Date(date);
          slotStart.setHours(hour, 0, 0, 0);
          const slotEnd = new Date(slotStart.getTime() + slotMin * 60000);

          // Check if slot conflicts with busy times
          const isBusy = busySlots.some(busy => {
            const busyStart = new Date(busy.start);
            const busyEnd = new Date(busy.end);
            return slotStart < busyEnd && slotEnd > busyStart;
          });

          if (!isBusy) {
            offers.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
              tz: tz,
              available: true
            });
          }
        }
      }
    }

    res.json({ offers, busySlots });

  } catch (error) {
    console.error('Google Calendar freebusy error:', error);
    res.status(500).json({
      error: 'freebusy_failed',
      message: error.message || 'Failed to fetch availability'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Microsoft OAuth: http://localhost:${PORT}/ms/oauth/start`);
  console.log(`ElevenLabs Tool: http://localhost:${PORT}/api/tools/create_meeting`);
  console.log(`Website Booking: http://localhost:${PORT}/api/book`);
  console.log(`Google Calendar: http://localhost:${PORT}/google/freebusy`);
});