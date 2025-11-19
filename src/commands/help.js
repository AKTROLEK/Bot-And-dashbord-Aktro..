const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands and information'),

  async execute(interaction) {
    const helpEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('📚 Bot Help & Commands')
      .setDescription('Full-featured streamer management bot with multi-platform support.')
      .addFields(
        {
          name: '👤 Streamer Commands',
          value: '`/apply` - Apply to become a streamer\n' +
                 '`/streamer profile` - View your streamer profile\n' +
                 '`/credits balance` - Check your credit balance\n' +
                 '`/credits history` - View your credit transaction history',
          inline: false,
        },
        {
          name: '🎫 Ticket Commands',
          value: '`/ticket create` - Create a support ticket\n' +
                 '`/ticket close` - Close the current ticket',
          inline: false,
        },
        {
          name: '⚙️ Management Commands (Staff Only)',
          value: '`/streamer approve` - Approve a streamer application\n' +
                 '`/streamer suspend` - Suspend a streamer\n' +
                 '`/streamer reactivate` - Reactivate a suspended streamer\n' +
                 '`/streamer list` - List all streamers\n' +
                 '`/credits add` - Add credits to a streamer\n' +
                 '`/credits deduct` - Deduct credits from a streamer\n' +
                 '`/ticket list` - List all open tickets\n' +
                 '`/ticket assign` - Assign a ticket to staff\n' +
                 '`/report weekly` - Generate weekly performance report\n' +
                 '`/report monthly` - Generate monthly performance report\n' +
                 '`/report top` - Show top performing streamers\n' +
                 '`/report platform` - Compare performance across platforms',
          inline: false,
        },
        {
          name: '💰 Credit System',
          value: 'Earn credits by:\n' +
                 '• Uploading videos (10 credits)\n' +
                 '• Streaming (5 credits per hour)\n' +
                 '• Achieving goals (50 credits)\n' +
                 '• Weekly bonus (25 credits)',
          inline: false,
        },
        {
          name: '🎮 Supported Platforms',
          value: '• YouTube\n• Twitch\n• TikTok',
          inline: false,
        },
        {
          name: '📊 Features',
          value: '• Application & Ticketing System\n' +
                 '• Platform-specific streaming rules\n' +
                 '• Performance reports & analytics\n' +
                 '• Automated credit system\n' +
                 '• Smart alerts & notifications\n' +
                 '• Multi-platform support\n' +
                 '• Direct management communication',
          inline: false,
        }
      )
      .setFooter({ text: 'For more help, create a support ticket!' })
      .setTimestamp();

    await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
  },
};
