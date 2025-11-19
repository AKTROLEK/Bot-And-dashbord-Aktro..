const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../utils/embeds');
const database = require('../utils/database');
const Ticket = require('../models/Ticket');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('apply')
    .setDescription('Apply to become a streamer')
    .addStringOption(option =>
      option.setName('platform')
        .setDescription('Which platform do you stream on?')
        .setRequired(true)
        .addChoices(
          { name: 'YouTube', value: 'youtube' },
          { name: 'Twitch', value: 'twitch' },
          { name: 'TikTok', value: 'tiktok' }
        ))
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Your username/channel on that platform')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Why do you want to join?')
        .setRequired(true)),

  async execute(interaction) {
    const platform = interaction.options.getString('platform');
    const username = interaction.options.getString('username');
    const reason = interaction.options.getString('reason');

    await interaction.deferReply({ ephemeral: true });

    try {
      // Check if user already has an open application
      const existingTickets = database.getTicketsByUser(interaction.user.id);
      const openApplication = existingTickets.find(
        ticket => ticket.type === 'application' && ticket.status === 'open'
      );

      if (openApplication) {
        return interaction.editReply({
          embeds: [errorEmbed('Application Already Exists', 'You already have an open application. Please wait for a response.')],
        });
      }

      // Create ticket channel
      const guild = interaction.guild;
      const ticketChannel = await guild.channels.create({
        name: `application-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: config.channels.ticketCategory,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
          // Add permission for management roles
          ...config.roles.admin.map(roleId => ({
            id: roleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
          })),
          ...config.roles.streamerManager.map(roleId => ({
            id: roleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
          })),
        ],
      });

      // Create ticket object
      const ticket = new Ticket({
        type: 'application',
        userId: interaction.user.id,
        username: interaction.user.username,
        channelId: ticketChannel.id,
        metadata: {
          platform,
          platformUsername: username,
          reason,
        },
      });

      // Save ticket to database
      database.saveTicket(ticket.id, ticket);

      // Send message in ticket channel
      const applicationEmbed = successEmbed('Streamer Application', 
        `**Applicant:** ${interaction.user}\n` +
        `**Platform:** ${platform}\n` +
        `**Username:** ${username}\n` +
        `**Reason:** ${reason}\n\n` +
        `A staff member will review your application shortly.`
      );

      await ticketChannel.send({ 
        content: `${interaction.user} | ${config.roles.streamerManager.map(id => `<@&${id}>`).join(' ')}`,
        embeds: [applicationEmbed] 
      });

      // Log to application channel if configured
      if (config.channels.applicationLog) {
        const logChannel = await guild.channels.fetch(config.channels.applicationLog);
        if (logChannel) {
          await logChannel.send({
            embeds: [successEmbed('New Application', 
              `**User:** ${interaction.user}\n` +
              `**Platform:** ${platform}\n` +
              `**Ticket:** ${ticketChannel}`
            )],
          });
        }
      }

      // Reply to user
      await interaction.editReply({
        embeds: [successEmbed('Application Submitted', 
          `Your application has been submitted! Please check ${ticketChannel} for updates.`
        )],
      });

    } catch (error) {
      console.error('Error creating application:', error);
      await interaction.editReply({
        embeds: [errorEmbed('Error', 'Failed to create application. Please try again later.')],
      });
    }
  },
};
