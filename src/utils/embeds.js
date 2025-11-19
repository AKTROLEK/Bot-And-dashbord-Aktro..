const { EmbedBuilder } = require('discord.js');

/**
 * Create a standard success embed
 */
function successEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Create a standard error embed
 */
function errorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Create a standard info embed
 */
function infoEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(`ℹ️ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Create a standard warning embed
 */
function warningEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0xffaa00)
    .setTitle(`⚠️ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Create a ticket embed
 */
function ticketEmbed(ticket) {
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(`🎫 Ticket #${ticket.id}`)
    .addFields(
      { name: 'Type', value: ticket.type, inline: true },
      { name: 'Status', value: ticket.status, inline: true },
      { name: 'Priority', value: ticket.priority, inline: true },
      { name: 'Created', value: `<t:${Math.floor(ticket.createdAt.getTime() / 1000)}:R>`, inline: true }
    )
    .setTimestamp();

  if (ticket.assignedTo) {
    embed.addFields({ name: 'Assigned To', value: `<@${ticket.assignedTo}>`, inline: true });
  }

  return embed;
}

/**
 * Create a streamer profile embed
 */
function streamerProfileEmbed(streamer) {
  const platforms = Object.keys(streamer.platforms).join(', ') || 'None';
  
  return new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle(`👤 Streamer Profile: ${streamer.username}`)
    .addFields(
      { name: 'User ID', value: streamer.userId, inline: true },
      { name: 'Status', value: streamer.status, inline: true },
      { name: 'Credits', value: `💰 ${streamer.credits}`, inline: true },
      { name: 'Platforms', value: platforms, inline: false },
      { name: 'Total Videos', value: streamer.stats.totalVideos.toString(), inline: true },
      { name: 'Total Stream Hours', value: streamer.stats.totalStreamHours.toString(), inline: true },
      { name: 'Violations', value: streamer.violations.length.toString(), inline: true }
    )
    .setTimestamp();
}

/**
 * Create a performance report embed
 */
function reportEmbed(title, data) {
  const embed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle(`📊 ${title}`)
    .setTimestamp();

  if (data.fields) {
    embed.addFields(data.fields);
  }

  if (data.description) {
    embed.setDescription(data.description);
  }

  return embed;
}

module.exports = {
  successEmbed,
  errorEmbed,
  infoEmbed,
  warningEmbed,
  ticketEmbed,
  streamerProfileEmbed,
  reportEmbed,
};
