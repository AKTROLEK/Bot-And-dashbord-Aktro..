const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed, streamerProfileEmbed } = require('../utils/embeds');
const { hasManagementPermission } = require('../utils/permissions');
const database = require('../utils/database');
const Streamer = require('../models/Streamer');
const { t } = require('../utils/localization');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('streamer')
    .setDescription('Streamer management commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('profile')
        .setDescription('View your streamer profile or another streamer\'s profile')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to view profile for (Management only)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('approve')
        .setDescription('Approve a streamer application (Management only)')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to approve')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('platform')
            .setDescription('Platform')
            .setRequired(true)
            .addChoices(
              { name: 'YouTube', value: 'youtube' },
              { name: 'Twitch', value: 'twitch' },
              { name: 'TikTok', value: 'tiktok' },
              { name: 'Kick', value: 'kick' } // <-- السطر الجديد هنا
            ))
        .addStringOption(option =>
          option.setName('username')
            .setDescription('Platform username/channel')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('suspend')
        .setDescription('Suspend a streamer (Management only)')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to suspend')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for suspension')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('reactivate')
        .setDescription('Reactivate a suspended streamer (Management only)')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to reactivate')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all streamers (Management only)')
        .addStringOption(option =>
          option.setName('status')
            .setDescription('Filter by status')
            .setRequired(false)
            .addChoices(
              { name: 'Active', value: 'active' },
              { name: 'Pending', value: 'pending' },
              { name: 'Suspended', value: 'suspended' }
            ))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'profile') {
      await this.viewProfile(interaction);
    } else if (subcommand === 'approve') {
      await this.approveStreamer(interaction);
    } else if (subcommand === 'suspend') {
      await this.suspendStreamer(interaction);
    } else if (subcommand === 'reactivate') {
      await this.reactivateStreamer(interaction);
    } else if (subcommand === 'list') {
      await this.listStreamers(interaction);
    }
  },

  async viewProfile(interaction) {
    const targetUser = interaction.options.getUser('user');
    const userId = targetUser ? targetUser.id : interaction.user.id;
    
    await interaction.deferReply({ ephemeral: true });

    try {
      // Check permissions for viewing others
      if (targetUser && targetUser.id !== interaction.user.id) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!hasManagementPermission(member)) {
          return interaction.editReply({
            embeds: [errorEmbed(t('PERMISSION_DENIED'), t('CAN_ONLY_VIEW_OWN_PROFILE'))],
          });
        }
      }

      const streamerData = database.getStreamer(userId);
      
      if (!streamerData) {
        return interaction.editReply({
          embeds: [errorEmbed(t('NOT_FOUND'), t('NO_STREAMER_PROFILE_USER'))],
        });
      }

      const streamer = new Streamer(streamerData);
      
      await interaction.editReply({
        embeds: [streamerProfileEmbed(streamer)],
      });

    } catch (error) {
      console.error('Error viewing profile:', error);
      await interaction.editReply({
        embeds: [errorEmbed(t('ERROR'), t('FAILED_LOAD_PROFILE'))],
      });
    }
  },

  async approveStreamer(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    
    if (!hasManagementPermission(member)) {
      return interaction.reply({
        embeds: [errorEmbed(t('PERMISSION_DENIED'), t('NO_PERMISSION_APPROVE_STREAMERS'))],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      const user = interaction.options.getUser('user');
      const platform = interaction.options.getString('platform');
      const username = interaction.options.getString('username');

      // Check if streamer already exists
      let streamerData = database.getStreamer(user.id);
      
      if (streamerData) {
        // Update existing streamer
        const streamer = new Streamer(streamerData);
        streamer.platforms[platform] = username;
        streamer.status = 'active';
        database.saveStreamer(user.id, streamer);
        
        await interaction.editReply({
          embeds: [successEmbed(t('STREAMER_UPDATED'), `${user} ${t('HAS_BEEN_UPDATED_ACTIVATED')}\n${t('PLATFORM')}: ${platform}\n${t('USERNAME')}: ${username}`)],
        });
      } else {
        // Create new streamer
        const streamer = new Streamer({
          userId: user.id,
          username: user.username,
          status: 'active',
          platforms: {
            [platform]: username,
          },
          credits: 100, // Starting bonus
        });
        
        database.saveStreamer(user.id, streamer);
        
        await interaction.editReply({
          embeds: [successEmbed(t('STREAMER_APPROVED'), `${user} ${t('HAS_BEEN_APPROVED')}\n${t('PLATFORM')}: ${platform}\n${t('USERNAME')}: ${username}\n${t('NEW_BALANCE')}: 100`)],
        });
      }

    } catch (error) {
      console.error('Error approving streamer:', error);
      await interaction.editReply({
        embeds: [errorEmbed(t('ERROR'), t('FAILED_APPROVE_STREAMER'))],
      });
    }
  },

  async suspendStreamer(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    
    if (!hasManagementPermission(member)) {
      return interaction.reply({
        embeds: [errorEmbed(t('PERMISSION_DENIED'), t('NO_PERMISSION_SUSPEND_STREAMERS'))],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason');

      const streamerData = database.getStreamer(user.id);
      
      if (!streamerData) {
        return interaction.editReply({
          embeds: [errorEmbed(t('NOT_FOUND'), t('NOT_A_STREAMER'))],
        });
      }

      const streamer = new Streamer(streamerData);
      streamer.status = 'suspended';
      streamer.addViolation({
        type: 'suspension',
        reason,
        suspendedBy: interaction.user.id,
      });
      
      database.saveStreamer(user.id, streamer);

      await interaction.editReply({
        embeds: [successEmbed(t('STREAMER_SUSPENDED'), `${user} ${t('HAS_BEEN_SUSPENDED')}\n${t('REASON')}: ${reason}`)],
      });

    } catch (error) {
      console.error('Error suspending streamer:', error);
      await interaction.editReply({
        embeds: [errorEmbed(t('ERROR'), t('FAILED_SUSPEND_STREAMER'))],
      });
    }
  },

  async reactivateStreamer(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    
    if (!hasManagementPermission(member)) {
      return interaction.reply({
        embeds: [errorEmbed(t('PERMISSION_DENIED'), t('NO_PERMISSION_REACTIVATE_STREAMERS'))],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      const user = interaction.options.getUser('user');

      const streamerData = database.getStreamer(user.id);
      
      if (!streamerData) {
        return interaction.editReply({
          embeds: [errorEmbed(t('NOT_FOUND'), t('NOT_A_STREAMER'))],
        });
      }

      const streamer = new Streamer(streamerData);
      streamer.status = 'active';
      
      database.saveStreamer(user.id, streamer);

      await interaction.editReply({
        embeds: [successEmbed(t('STREAMER_REACTIVATED'), `${user} ${t('HAS_BEEN_REACTIVATED')}`)],
      });

    } catch (error) {
      console.error('Error reactivating streamer:', error);
      await interaction.editReply({
        embeds: [errorEmbed(t('ERROR'), t('FAILED_REACTIVATE_STREAMER'))],
      });
    }
  },

  async listStreamers(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    
    if (!hasManagementPermission(member)) {
      return interaction.reply({
        embeds: [errorEmbed(t('PERMISSION_DENIED'), t('NO_PERMISSION_LIST_STREAMERS'))],
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const status = interaction.options.getString('status');
      const allStreamers = database.getAllStreamers();
      
      let streamers = Object.values(allStreamers);
      if (status) {
        streamers = streamers.filter(s => s.status === status);
      }

      if (streamers.length === 0) {
        return interaction.editReply({
          embeds: [successEmbed(t('STREAMER_LIST'), t('NO_STREAMERS_FOUND'))],
        });
      }

      const streamerList = streamers.map(s => 
        `<@${s.userId}> - **${s.status}** - ${t('CREDITS')}: ${s.credits} - ${t('PLATFORM')}: ${Object.keys(s.platforms).join(', ')}`
      ).join('\n');

      await interaction.editReply({
        embeds: [successEmbed(`${t('STREAMERS')}${status ? ` (${status})` : ''}`, streamerList)],
      });

    } catch (error) {
      console.error('Error listing streamers:', error);
      await interaction.editReply({
        embeds: [errorEmbed(t('ERROR'), t('FAILED_LOAD_STREAMERS'))],
      });
    }
  },
};
