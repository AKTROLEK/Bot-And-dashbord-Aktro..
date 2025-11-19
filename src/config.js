require('dotenv').config();

module.exports = {
  // Discord Configuration
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
  },

  // Roles Configuration
  roles: {
    admin: process.env.ADMIN_ROLE_IDS?.split(',') || [],
    streamerManager: process.env.STREAMER_MANAGER_ROLE_IDS?.split(',') || [],
  },

  // Channels Configuration
  channels: {
    ticketCategory: process.env.TICKET_CATEGORY_ID,
    applicationLog: process.env.APPLICATION_LOG_CHANNEL_ID,
    alerts: process.env.ALERTS_CHANNEL_ID,
    reports: process.env.REPORTS_CHANNEL_ID,
  },

  // Platform API Keys
  platforms: {
    youtube: {
      apiKey: process.env.YOUTUBE_API_KEY,
    },
    twitch: {
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
    },
    tiktok: {
      apiKey: process.env.TIKTOK_API_KEY,
    },
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'sqlite:./data/database.sqlite',
  },

  // REST API Configuration
  api: {
    port: process.env.API_PORT || 3000,
    secret: process.env.API_SECRET,
  },

  // Webhook Configuration
  webhook: {
    secret: process.env.WEBHOOK_SECRET,
  },

  // Platform Rules
  platformRules: {
    youtube: {
      minWeeklyVideos: 3,
      minWeeklyStreamHours: 5,
      contentTypes: ['gaming', 'entertainment', 'education'],
    },
    twitch: {
      minWeeklyVideos: 0,
      minWeeklyStreamHours: 10,
      contentTypes: ['gaming', 'just chatting', 'creative'],
    },
    tiktok: {
      minWeeklyVideos: 7,
      minWeeklyStreamHours: 0,
      contentTypes: ['short-form', 'viral', 'trending'],
    },
  },

  // Credit System
  credits: {
    videoUpload: 10,
    streamHour: 5,
    goalAchievement: 50,
    weeklyBonus: 25,
  },
};
