# Setup Guide

This guide will help you set up and run the Bot-And-Dashboard-Aktro Discord bot.

## Prerequisites

Before you begin, make sure you have:

1. **Node.js 16.9.0 or higher** installed on your system
2. **A Discord Bot** created on the [Discord Developer Portal](https://discord.com/developers/applications)
3. **API Keys** for the platforms you want to support:
   - YouTube Data API v3 key
   - Twitch Client ID and Client Secret
   - TikTok API key (optional, requires business account)

## Step 1: Discord Bot Setup

### 1.1 Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give it a name and click "Create"
4. Note down your **Application ID** (this is your CLIENT_ID)

### 1.2 Create a Bot User

1. In your application, go to the "Bot" section
2. Click "Add Bot"
3. Click "Reset Token" and copy the token (this is your DISCORD_TOKEN)
4. Enable the following Privileged Gateway Intents:
   - ✅ Presence Intent
   - ✅ Server Members Intent
   - ✅ Message Content Intent

### 1.3 Invite the Bot to Your Server

1. Go to the "OAuth2" → "URL Generator" section
2. Select scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Select bot permissions:
   - ✅ Manage Channels
   - ✅ Manage Roles
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Read Message History
   - ✅ Mention Everyone
   - ✅ Use Slash Commands
4. Copy the generated URL and open it in your browser
5. Select your server and authorize the bot

## Step 2: Get API Keys

### 2.1 YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "YouTube Data API v3"
4. Go to "Credentials" and create an API key
5. Copy the API key

### 2.2 Twitch API Keys

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Register a new application
3. Set OAuth Redirect URL to `http://localhost`
4. Copy the **Client ID** and **Client Secret**

### 2.3 TikTok API (Optional)

TikTok API requires business account approval. For now, you can leave this empty or use a placeholder.

## Step 3: Server Setup

### 3.1 Create Required Roles

Create these roles in your Discord server:

1. **Admin Role** - Full bot management permissions
2. **Streamer Manager Role** - Can manage streamers and tickets

Note down their Role IDs (enable Developer Mode in Discord, right-click role → Copy ID)

### 3.2 Create Required Channels

Create these channels in your Discord server:

1. **Ticket Category** - A category for ticket channels
2. **Application Log Channel** - For logging new applications
3. **Alerts Channel** - For automated alerts
4. **Reports Channel** - For performance reports (optional)

Note down their Channel IDs (right-click channel → Copy ID)

## Step 4: Bot Installation

### 4.1 Clone and Install

```bash
# Clone the repository
git clone https://github.com/AKTROLEK/Bot-And-dashbord-Aktro...git
cd Bot-And-dashbord-Aktro..

# Install dependencies
npm install
```

### 4.2 Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your favorite editor
nano .env  # or vim, code, etc.
```

Fill in the following in your `.env` file:

```env
# Discord Configuration
DISCORD_TOKEN=your_bot_token_from_step_1.2
CLIENT_ID=your_application_id_from_step_1.1
GUILD_ID=your_server_id

# Management Roles (comma-separated IDs from step 3.1)
ADMIN_ROLE_IDS=role_id_1,role_id_2
STREAMER_MANAGER_ROLE_IDS=role_id_3,role_id_4

# Channel IDs (from step 3.2)
TICKET_CATEGORY_ID=category_id
APPLICATION_LOG_CHANNEL_ID=channel_id
ALERTS_CHANNEL_ID=channel_id
REPORTS_CHANNEL_ID=channel_id

# API Keys (from step 2)
YOUTUBE_API_KEY=your_youtube_api_key
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
TIKTOK_API_KEY=your_tiktok_api_key_optional

# REST API Configuration
API_PORT=3000
API_SECRET=generate_a_random_secret_here
WEBHOOK_SECRET=generate_a_random_secret_here
```

**Tips:**
- To get your Guild ID: Enable Developer Mode in Discord → Right-click your server → Copy ID
- Generate strong random secrets for API_SECRET and WEBHOOK_SECRET

### 4.3 Deploy Commands

Deploy the slash commands to your Discord server:

```bash
npm run deploy
```

You should see output like:
```
✅ Loaded command: apply
✅ Loaded command: credits
✅ Loaded command: help
✅ Loaded command: report
✅ Loaded command: streamer
✅ Loaded command: ticket
📤 Started refreshing 6 application (/) commands.
✅ Successfully reloaded 6 guild commands.
```

### 4.4 Start the Bot

```bash
npm start
```

You should see:
```
✅ Loaded command: apply
✅ Loaded command: credits
...
✅ Loaded event: ready
✅ Loaded event: interactionCreate
✅ Bot is ready! Logged in as YourBotName#1234
📊 Serving 1 guild(s)
✅ REST API server started on port 3000
✅ Starting monitoring service...
✅ Monitoring tasks scheduled
```

## Step 5: Verify Installation

### 5.1 Test Commands

In your Discord server, try these commands:

1. Type `/` and you should see your bot's commands
2. Try `/help` to see the help menu
3. Try `/apply` as a regular user
4. Try `/streamer list` as an admin

### 5.2 Check API

Open your browser and visit:
```
http://localhost:3000/health
```

You should see:
```json
{
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": "2024-11-19T..."
}
```

## Step 6: Production Deployment

For production deployment, consider:

### 6.1 Process Manager

Use PM2 to keep the bot running:

```bash
# Install PM2
npm install -g pm2

# Start the bot with PM2
pm2 start src/index.js --name aktro-bot

# Save the process list
pm2 save

# Set PM2 to start on boot
pm2 startup
```

### 6.2 Database Migration

For production, migrate from JSON to a proper database:

1. Install a database driver (e.g., `mongoose` for MongoDB)
2. Update `src/utils/database.js` to use the database
3. Migrate existing data from JSON files

### 6.3 Reverse Proxy

If exposing the API publicly, use a reverse proxy like Nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 6.4 Environment Security

- Never commit your `.env` file
- Use environment variables in production
- Rotate API keys regularly
- Monitor logs for suspicious activity

## Troubleshooting

### Bot doesn't respond to commands

**Solution:**
1. Make sure you deployed commands: `npm run deploy`
2. Check if the bot is online in Discord
3. Verify the bot has proper permissions
4. Check console for error messages

### "Missing Access" error

**Solution:**
1. Check bot permissions in server settings
2. Verify role hierarchy (bot role should be above managed roles)
3. Grant necessary permissions (Manage Channels, Send Messages, etc.)

### API returns 401 Unauthorized

**Solution:**
1. Make sure you're including the `X-API-Key` header
2. Verify the API key matches `API_SECRET` in your `.env`
3. Check if the value is correct (no extra spaces or quotes)

### YouTube/Twitch API errors

**Solution:**
1. Verify your API keys are correct
2. Check if APIs are enabled in respective consoles
3. Ensure you haven't exceeded rate limits
4. Test API keys directly with curl

### Channels not being created

**Solution:**
1. Verify `TICKET_CATEGORY_ID` is set correctly
2. Check bot has "Manage Channels" permission
3. Ensure category exists and bot can access it

## Getting Help

If you encounter issues:

1. Check the console logs for error messages
2. Enable debug mode by adding `DEBUG=true` to your `.env`
3. Review the [README.md](./README.md) for additional information
4. Open an issue on GitHub with:
   - Detailed description of the problem
   - Console logs (remove sensitive information)
   - Steps to reproduce
   - Your environment (OS, Node.js version, etc.)

## Next Steps

After setup:

1. Configure platform-specific rules in `src/config.js`
2. Customize credit amounts for different actions
3. Set up webhooks from platforms to your bot's API
4. Create a credit store for rewards
5. Monitor bot performance and adjust as needed

Enjoy your fully-featured streamer management bot! 🚀
