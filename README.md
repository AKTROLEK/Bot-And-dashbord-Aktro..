# Bot-And-Dashboard-Aktro

**Full-Featured Discord Bot for Multi-Platform Streamer Management**

A comprehensive Discord bot designed to manage streamers across YouTube, TikTok, and Twitch with application systems, ticket management, credit tracking, performance reports, and automated alerts.

## ✨ Features

### 🎫 Application & Ticketing System
- Easy streamer application process
- Automated ticket creation with private channels
- Multiple ticket types: applications, issues, credit adjustments, promotions, technical support
- Role-based ticket visibility
- Ticket assignment and management

### 📋 Platform-Specific Rules
- Customizable rules for each platform (YouTube, TikTok, Twitch)
- Required weekly videos and streaming hours per platform
- Automated compliance checking
- Violation tracking and alerts

### 📊 Performance Reports
- Weekly and monthly performance analytics
- Top streamer identification (top 3 each week)
- Cross-platform performance comparisons
- View and engagement tracking

### 💰 Credit System (Wallet)
- Automatic credit earning:
  - 10 credits per video upload
  - 5 credits per streaming hour
  - 50 credits for goal achievements
  - 25 credits weekly bonus
- Management-only credit adjustments
- Credit transaction history
- Future: Credit store for rewards

### 🔔 Smart Alerts
- New video upload notifications
- Stream start/end alerts
- Inactivity warnings
- Rule violation notifications
- Automated compliance reports

### 🌐 Multi-Platform Support
- **YouTube**: Channel stats, recent videos, live status
- **Twitch**: User info, stream status, VODs
- **TikTok**: Placeholder (requires business API access)

### 🤝 Streamer Community
- Direct management communication via tickets
- Performance tracking and feedback
- Achievement system
- Violation tracking for accountability

### 🔐 Security & Integration
- REST API for external integrations
- Webhook handlers for platform events
- API key authentication
- Role-based permissions
- Secure credit management

## 🚀 Setup & Installation

### Prerequisites
- Node.js 16.9.0 or higher
- Discord Bot Token and Application
- API Keys for platforms (YouTube, Twitch, TikTok)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/AKTROLEK/Bot-And-dashbord-Aktro...git
   cd Bot-And-dashbord-Aktro..
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your Discord bot token, client ID, and guild ID
   - Add your API keys for YouTube, Twitch, and TikTok
   - Configure role IDs and channel IDs
   ```bash
   cp .env.example .env
   ```

4. **Deploy slash commands**
   ```bash
   npm run deploy
   ```

5. **Start the bot**
   ```bash
   npm start
   ```

## ⚙️ Configuration

Edit `.env` file with your configuration:

```env
# Discord Configuration
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here

# Management Roles (comma-separated IDs)
ADMIN_ROLE_IDS=123456789,987654321
STREAMER_MANAGER_ROLE_IDS=123456789,987654321

# Channel IDs
TICKET_CATEGORY_ID=your_category_id
APPLICATION_LOG_CHANNEL_ID=your_channel_id
ALERTS_CHANNEL_ID=your_channel_id
REPORTS_CHANNEL_ID=your_channel_id

# API Keys
YOUTUBE_API_KEY=your_youtube_api_key
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
TIKTOK_API_KEY=your_tiktok_api_key

# REST API
API_PORT=3000
API_SECRET=your_api_secret_key
```

## 🌍 Localization (Language Support)

The bot supports multiple languages with a two-level localization system:

### Command Names (Discord API Level)
- Discord only supports specific locales for slash commands
- Command names and descriptions will appear in **English** by default
- This is a limitation imposed by Discord's API (Arabic is not supported)
- Supported Discord locales include: English, Spanish, French, German, etc.

### User-Facing Messages (Bot Level)
- **Full Arabic support** for all bot responses, embeds, and messages
- Messages adapt to user's Discord language preference
- Includes Arabic translations for:
  - Application confirmations
  - Ticket messages
  - Credit notifications
  - Error messages
  - Success confirmations

### Adding New Languages
To add a new language:

1. Create a new JSON file in `src/locales/` (e.g., `fr.json` for French)
2. Copy the structure from `en.json` and translate all values
3. If the language is supported by Discord, add its locale code to `LOCALE_MAP` in `src/utils/localization.js`

**Note**: Even if Discord doesn't support command localization for your language, you can still add full support for user-facing messages.

## 📝 Commands

### User Commands
- `/apply` - Apply to become a streamer
- `/streamer profile` - View streamer profile
- `/credits balance` - Check credit balance
- `/credits history` - View credit transaction history
- `/ticket create` - Create a support ticket
- `/ticket close` - Close the current ticket
- `/help` - Show all available commands

### Management Commands (Staff Only)
- `/streamer approve` - Approve a streamer application
- `/streamer suspend` - Suspend a streamer
- `/streamer reactivate` - Reactivate a suspended streamer
- `/streamer list` - List all streamers
- `/credits add` - Add credits to a streamer
- `/credits deduct` - Deduct credits from a streamer
- `/ticket list` - List all open tickets
- `/ticket assign` - Assign a ticket to staff
- `/report weekly` - Generate weekly performance report
- `/report monthly` - Generate monthly performance report
- `/report top` - Show top performing streamers
- `/report platform` - Compare performance across platforms

## 🔌 REST API

The bot includes a REST API for external integrations:

### Endpoints

**Authentication**: Include `X-API-Key` header with your API secret

- `GET /health` - Health check (no auth required)
- `GET /api/streamers` - Get all streamers
- `GET /api/streamers/:userId` - Get specific streamer
- `POST /api/streamers/:userId/stats` - Update streamer stats
- `GET /api/tickets` - Get tickets (query: status, userId)
- `POST /webhook/platform-event` - Platform event webhook

### Webhook Events

Send events to `/webhook/platform-event` with `X-Webhook-Secret` header:

```json
{
  "platform": "youtube",
  "event": "video_uploaded",
  "userId": "discord_user_id",
  "data": {
    "url": "https://youtube.com/watch?v=...",
    "title": "Video Title"
  }
}
```

**Supported Events:**
- `video_uploaded` - New video uploaded
- `stream_started` - Stream started
- `stream_ended` - Stream ended

## 📊 Platform Rules

Default rules configured in `src/config.js`:

### YouTube
- Minimum 3 videos per week
- Minimum 5 streaming hours per week

### Twitch
- Minimum 0 videos per week
- Minimum 10 streaming hours per week

### TikTok
- Minimum 7 videos per week
- Minimum 0 streaming hours per week

Rules are customizable per platform and checked automatically.

## 🔄 Automated Tasks

The bot runs several automated tasks:

- **Daily 9 AM**: Compliance checking
- **Daily 12 PM**: Inactive streamer detection
- **Monday 12 AM**: Weekly stats reset
- **1st of Month 12 AM**: Monthly stats reset

## 🗂️ Project Structure

```
.
├── src/
│   ├── commands/        # Slash commands
│   │   ├── apply.js
│   │   ├── credits.js
│   │   ├── help.js
│   │   ├── report.js
│   │   ├── streamer.js
│   │   └── ticket.js
│   ├── events/          # Discord event handlers
│   │   ├── ready.js
│   │   └── interactionCreate.js
│   ├── models/          # Data models
│   │   ├── Streamer.js
│   │   └── Ticket.js
│   ├── services/        # External service integrations
│   │   ├── youtube.js
│   │   ├── twitch.js
│   │   ├── tiktok.js
│   │   └── monitor.js
│   ├── utils/           # Utility functions
│   │   ├── database.js
│   │   ├── embeds.js
│   │   └── permissions.js
│   ├── api/             # REST API
│   │   └── server.js
│   ├── config.js        # Configuration
│   └── index.js         # Main entry point
├── data/                # JSON database files (auto-created)
├── deploy-commands.js   # Command deployment script
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## 🛠️ Development

### Database

Currently uses JSON file storage for simplicity. Files are stored in `/data`:
- `streamers.json` - Streamer profiles
- `tickets.json` - Ticket data
- `credit-history.json` - Credit transactions

For production, consider migrating to a proper database (MongoDB, PostgreSQL, etc.).

### Adding New Commands

1. Create a new file in `src/commands/`
2. Export an object with `data` (SlashCommandBuilder) and `execute` function
3. Run `npm run deploy` to register the command

### Adding New Platform Integrations

1. Create a service file in `src/services/`
2. Implement required methods: `getUserInfo`, `getRecentVideos`, `isUserLive`
3. Add platform configuration to `src/config.js`
4. Update relevant commands to support the new platform

## 🔒 Security

- Never commit your `.env` file
- Keep your bot token and API keys secure
- Use role-based permissions for management commands
- Validate all user inputs
- Use API authentication for REST endpoints

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support, create a ticket in the Discord server or open an issue on GitHub.

## 🎯 Roadmap

- [ ] Add credit store for reward redemption
- [ ] Implement achievement badges
- [ ] Add more detailed analytics
- [ ] Create web dashboard
- [ ] Add support for more platforms (Facebook Gaming, Kick, etc.)
- [ ] Implement automated promotional content generation
- [ ] Add streamer collaboration features
- [ ] Create mobile app integration

## 👥 Authors

**AKTROLEK** - Initial work

## 🙏 Acknowledgments

- Discord.js for the excellent Discord API wrapper
- All platform APIs for data access
- The Discord community for support and feedback