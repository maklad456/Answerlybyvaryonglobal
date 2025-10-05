# ElevenLabs Agent Troubleshooting

## Current Error: "AI agent misconfigured"

Your n8n workflow is configured correctly! The issue is with the ElevenLabs agent configuration.

## Checklist to Fix:

### 1. Verify Agent ID

**In your script.js (line 531):**
```javascript
agent-id="agent_2101k60sp5xafpbsvrx43354evzw"
```

**In ElevenLabs Dashboard:**
- Go to your agent settings
- Copy the actual agent ID
- Make sure it matches `agent_2101k60sp5xafpbsvrx43354evzw`

### 2. Check Agent Status

In ElevenLabs Dashboard:
- [ ] Agent is Published/Activated
- [ ] Agent is not in Draft mode
- [ ] Agent has a valid voice selected
- [ ] Agent has a system prompt configured

### 3. Verify Tools Are Attached

Your agent needs these two tools:

**Tool 1: Get_Available_Slots**
- [ ] Tool is created
- [ ] Tool is attached to the agent
- [ ] URL: `https://mahmoudsahyoun.app.n8n.cloud/webhook/elevenlabs/call` (production URL)
- [ ] Method: POST
- [ ] Has required parameters: name, date, time

**Tool 2: Book_meeting**
- [ ] Tool is created
- [ ] Tool is attached to the agent
- [ ] URL: `https://mahmoudsahyoun.app.n8n.cloud/webhook/elevenlabs/call` (production URL)
- [ ] Method: POST
- [ ] Has required parameters: name, email, phone, date, time

### 4. Check n8n Workflow

- [x] Workflow is activated (toggle at top)
- [x] Webhook is set to Production URL
- [x] Google Calendar credentials are connected
- [x] OpenAI credentials are connected

### 5. Test the Flow

#### Test n8n Directly:
```bash
curl -X POST https://mahmoudsahyoun.app.n8n.cloud/webhook/elevenlabs/call \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "date": "2024-01-15", "time": "14:00"}'
```

#### Check n8n Executions:
1. Go to n8n dashboard
2. Click "Executions" tab
3. Look for recent executions
4. Check if they succeeded or failed

### 6. Common Issues

**Issue: Agent shows as "misconfigured"**
- Cause: Agent ID doesn't exist or agent is not published
- Fix: Verify agent ID and publish the agent

**Issue: Agent loads but tools don't work**
- Cause: Tools not attached to agent or wrong webhook URL
- Fix: Attach tools in agent settings, verify webhook URL

**Issue: Tools timeout**
- Cause: n8n workflow not responding
- Fix: Check n8n workflow is activated and credentials are valid

## Your Current Setup (All Correct!)

### Website → ElevenLabs
- Website: https://answerlyvoice.com
- Agent ID in code: `agent_2101k60sp5xafpbsvrx43354evzw`
- Widget loads on "Try AI Agent" button

### ElevenLabs → n8n
- Webhook URL: `https://mahmoudsahyoun.app.n8n.cloud/webhook/elevenlabs/call`
- Both tools point to this URL
- n8n receives requests and processes them

### n8n → Google Calendar + OpenAI
- n8n workflow uses native Google Calendar nodes
- No localhost dependencies
- All cloud-based

## What You DON'T Need

❌ You don't need to point n8n to your Render backend
❌ You don't need to update any URLs in n8n
❌ You don't need to change the Availability or Appointments nodes

## What You DO Need

✅ Verify agent ID matches
✅ Make sure agent is published in ElevenLabs
✅ Make sure both tools are attached to the agent
✅ Verify n8n workflow is activated

## Next Steps

1. Go to ElevenLabs dashboard
2. Find your agent (search for `agent_2101k60sp5xafpbsvrx43354evzw`)
3. Check if it's published
4. Check if both tools are attached
5. Test on https://answerlyvoice.com

If agent doesn't exist with that ID, you'll need to either:
- Create a new agent and update the ID in script.js
- Find the correct agent ID and update script.js

