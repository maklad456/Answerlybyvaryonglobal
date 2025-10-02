# Answerly AI Voice Agent for Medical Clinics

An AI-powered voice agent that answers patient calls 24/7, books appointments, and enhances medical clinic operations with Google Calendar integration.

## 🚀 Features

- **24/7 AI Voice Agent**: Never miss a patient call again
- **Google Calendar Integration**: Automatic appointment booking
- **Revenue Generation**: Captures every call and converts them to appointments
- **Cost Effective**: Pays for itself in less than one month
- **Easy Setup**: Instant deployment with minimal configuration
- **Responsive Website**: Modern, mobile-friendly interface

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Google Cloud Account** with Calendar API enabled
- **ElevenLabs API Key** for voice synthesis
- **EmailJS Account** for email notifications

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/answerly-ai-voice-agent.git
cd answerly-ai-voice-agent
```

### 2. Install Dependencies

```bash
cd Server
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `Server` directory with the following variables:

```env
# Server Configuration
PORT=3000
FRONTEND_ORIGIN=http://localhost:8000

# Booking Configuration
BOOKING_EMAIL=your-email@domain.com
BOOKING_TZ=America/Los_Angeles
BOOKING_LENGTH_MIN=60
BOOKING_BUFFER_MIN=30
BOOKING_WORK_HOURS=Mon-Fri 08:00-17:00
SYNTHETIC_BUSY=false

# Google Calendar API (Service Account)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=your-calendar@gmail.com

# ElevenLabs API
ELEVENLABS_TOOL_TOKEN=your-elevenlabs-api-key
```

### 4. Google Calendar Setup

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Calendar API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API" and enable it

3. **Create Service Account**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Download the JSON key file
   - Extract the `client_email` and `private_key` for your `.env` file

4. **Share Calendar**:
   - Open Google Calendar
   - Share your calendar with the service account email
   - Give it "Make changes to events" permission

### 5. ElevenLabs Setup

1. **Create Account**: Sign up at [ElevenLabs](https://elevenlabs.io/)
2. **Get API Key**: Go to your profile > API Keys
3. **Add to .env**: Copy your API key to `ELEVENLABS_TOOL_TOKEN`

### 6. EmailJS Setup (Optional)

1. **Create Account**: Sign up at [EmailJS](https://www.emailjs.com/)
2. **Create Service**: Set up an email service (Gmail, Outlook, etc.)
3. **Get Credentials**: Copy your Service ID, Template ID, and Public Key
4. **Update Frontend**: Add these to `script.js` in the EmailJS configuration

## 🚀 Running the Application

### Start the Backend Server

```bash
cd Server
node index.js
```

The server will start on `http://localhost:3000`

### Start the Frontend

Open `index.html` in your browser or serve it with a local server:

```bash
# Using Python (if installed)
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server -p 8000

# Or simply open index.html in your browser
```

The frontend will be available at `http://localhost:8000`

## 🌐 Deployment

### Using Cloudflare Tunnel (Recommended for Development)

1. **Install Cloudflare Tunnel**:
   ```bash
   # Download cloudflared from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
   ```

2. **Create Tunnel**:
   ```bash
   cloudflared tunnel create answerly
   ```

3. **Configure Tunnel**:
   ```bash
   cloudflared tunnel route dns answerly your-domain.com
   ```

4. **Run Tunnel**:
   ```bash
   cloudflared tunnel run answerly
   ```

### Using Vercel (Frontend)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

### Using Railway/Render (Backend)

1. **Connect Repository** to Railway or Render
2. **Set Environment Variables** in the platform dashboard
3. **Deploy** automatically on push

## 📁 Project Structure

```
answerly-ai-voice-agent/
├── Server/                 # Backend API server
│   ├── index.js           # Main server file
│   ├── package.json       # Node.js dependencies
│   └── .env              # Environment variables (create this)
├── index.html            # Main website
├── styles.css            # Website styles
├── script.js             # Frontend JavaScript
├── logo.svg              # Company logo
├── favicon.svg           # Website favicon
└── media/                # Video and image assets
```

## 🔧 API Endpoints

- `GET /health` - Health check
- `GET /google/status` - Google Calendar connection status
- `GET /google/freebusy` - Get available time slots
- `POST /api/book` - Book an appointment
- `POST /api/tools/voice_agent` - ElevenLabs voice agent endpoint

## 🧪 Testing

### Test Google Calendar Connection

```bash
curl http://localhost:3000/google/status
```

### Test Booking System

```bash
curl -X POST "http://localhost:3000/api/book" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "reason": "Demo",
    "start_iso": "2025-01-15T10:00:00.000Z",
    "duration_min": 30,
    "notes": "Test booking"
  }'
```

## 🔒 Security Notes

- Never commit your `.env` file to version control
- Use environment variables for all sensitive data
- Regularly rotate API keys and service account credentials
- Enable HTTPS in production

## 📞 Support

For support or questions:
- Email: info@varyonglobal.com
- Website: [Answerly by Varyon](https://your-domain.com)

## 📄 License

This project is proprietary software owned by Varyon Global. All rights reserved.

## 🚀 Quick Start Commands

```bash
# Clone and setup
git clone https://github.com/YOUR_USERNAME/answerly-ai-voice-agent.git
cd answerly-ai-voice-agent/Server
npm install

# Configure environment (create .env file with your credentials)
# Then start the server
node index.js

# In another terminal, serve the frontend
cd ..
python -m http.server 8000

# Open http://localhost:8000 in your browser
```

---

**Built with ❤️ by Varyon Global**