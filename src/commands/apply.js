const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../utils/embeds');
const database = require('../utils/database');
const Ticket = require('../models/Ticket');
const config = require('../config');
const { t, getAllTranslations } = require('../utils/localization'); // استيراد أداة اللغة

// بناء الأمر باستخدام الترجمات
const commandData = new SlashCommandBuilder()
    .setName(t('COMMAND_APPLY_NAME', 'en')) // الاسم الأساسي بالإنجليزية
    .setDescription(t('COMMAND_APPLY_DESCRIPTION', 'en')) // الوصف الأساسي بالإنجليزية
    .setNameLocalizations(getAllTranslations('COMMAND_APPLY_NAME')) // ترجمات الاسم
    .setDescriptionLocalizations(getAllTranslations('COMMAND_APPLY_DESCRIPTION')); // ترجمات الوصف

// إضافة الخيارات مع الترجمات
commandData.addStringOption(option =>
    option.setName(t('COMMAND_APPLY_PLATFORM_NAME', 'en'))
        .setDescription(t('COMMAND_APPLY_PLATFORM_DESCRIPTION', 'en'))
        .setNameLocalizations(getAllTranslations('COMMAND_APPLY_PLATFORM_NAME'))
        .setDescriptionLocalizations(getAllTranslations('COMMAND_APPLY_PLATFORM_DESCRIPTION'))
        .setRequired(true)
        .addChoices(
            { name: t('PLATFORM_YOUTUBE'), value: 'youtube' },
            { name: t('PLATFORM_TWITCH'), value: 'twitch' },
            { name: t('PLATFORM_TIKTOK'), value: 'tiktok' },
            { name: t('PLATFORM_KICK'), value: 'kick' }
        )
);

commandData.addStringOption(option =>
    option.setName(t('COMMAND_APPLY_USERNAME_NAME', 'en'))
        .setDescription(t('COMMAND_APPLY_USERNAME_DESCRIPTION', 'en'))
        .setNameLocalizations(getAllTranslations('COMMAND_APPLY_USERNAME_NAME'))
        .setDescriptionLocalizations(getAllTranslations('COMMAND_APPLY_USERNAME_DESCRIPTION'))
        .setRequired(true)
);

commandData.addStringOption(option =>
    option.setName(t('COMMAND_APPLY_REASON_NAME', 'en'))
        .setDescription(t('COMMAND_APPLY_REASON_DESCRIPTION', 'en'))
        .setNameLocalizations(getAllTranslations('COMMAND_APPLY_REASON_NAME'))
        .setDescriptionLocalizations(getAllTranslations('COMMAND_APPLY_REASON_DESCRIPTION'))
        .setRequired(true)
);


module.exports = {
  data: commandData,

  async execute(interaction) {
    // تحديد لغة المستخدم لواجهة ديسكورد
    const userLocale = interaction.locale === 'ar' ? 'ar' : 'en';

    const platform = interaction.options.getString(t('COMMAND_APPLY_PLATFORM_NAME', 'en'));
    const username = interaction.options.getString(t('COMMAND_APPLY_USERNAME_NAME', 'en'));
    const reason = interaction.options.getString(t('COMMAND_APPLY_REASON_NAME', 'en'));

    await interaction.deferReply({ ephemeral: true });

    try {
      // Check if user already has an open application
      const existingTickets = database.getTicketsByUser(interaction.user.id);
      const openApplication = existingTickets.find(
        ticket => ticket.type === 'application' && ticket.status === 'open'
      );

      if (openApplication) {
        return interaction.editReply({
          embeds: [errorEmbed(t('EMBED_APPLICATION_ALREADY_EXISTS_TITLE', userLocale), t('EMBED_APPLICATION_ALREADY_EXISTS_DESCRIPTION', userLocale))],
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

      // Send message in ticket channel (using Arabic for the ticket)
      const applicationEmbed = successEmbed(t('TICKET_EMBED_TITLE', 'ar'), 
        `**${t('TICKET_EMBED_APPLICANT', 'ar')}:** ${interaction.user}\n` +
        `**${t('TICKET_EMBED_PLATFORM', 'ar')}:** ${platform}\n` +
        `**${t('TICKET_EMBED_USERNAME', 'ar')}:** ${username}\n` +
        `**${t('TICKET_EMBED_REASON', 'ar')}:** ${reason}\n\n` +
        t('TICKET_EMBED_FOOTER', 'ar')
      );

      await ticketChannel.send({ 
        content: `${interaction.user} | ${config.roles.streamerManager.map(id => `<@&${id}>`).join(' ')}`,
        embeds: [applicationEmbed] 
      });
      
      // Log and reply to user in their language
      if (config.channels.applicationLog) {
        const logChannel = await guild.channels.fetch(config.channels.applicationLog);
        if (logChannel) {
          await logChannel.send({
            embeds: [successEmbed('New Application', // Log is always in English for staff
              `**User:** ${interaction.user}\n` +
              `**Platform:** ${platform}\n` +
              `**Ticket:** ${ticketChannel}`
            )],
          });
        }
      }

      await interaction.editReply({
        embeds: [successEmbed(t('EMBED_APPLICATION_SUCCESS_TITLE', userLocale), t('EMBED_APPLICATION_SUCCESS_DESCRIPTION', userLocale).replace('{channel}', ticketChannel.toString()))],
      });

    } catch (error) {
      console.error('Error creating application:', error);
      await interaction.editReply({
        embeds: [errorEmbed(t('EMBED_APPLICATION_ERROR_TITLE', userLocale), t('EMBED_APPLICATION_ERROR_DESCRIPTION', userLocale))],
      });
    }
  },
};
