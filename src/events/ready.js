const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} guild(s)`);
    
    // Set bot status
    client.user.setPresence({
      activities: [{ name: 'Streamers | /help' }],
      status: 'online',
    });
  },
};
