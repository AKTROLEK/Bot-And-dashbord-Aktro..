const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed, streamerProfileEmbed } = require('../utils/embeds');
const { hasManagementPermission } = require('../utils/permissions');
const database = require('../utils/database');
const Streamer = require('../models/Streamer');

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
              { name: 'TikTok', value: 'tiktok' }
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
            embeds: [errorEmbed('Permission Denied', 'You can only view your own profile.')],
          });
        }
      }

      const streamerData = database.getStreamer(userId);
      
      if (!streamerData) {
        return interaction.editReply({
          embeds: [errorEmbed('Not Found', 'No streamer profile found for this user.')],
        });
      }

      const streamer = new Streamer(streamerData);
      
      await interaction.editReply({
        embeds: [streamerProfileEmbed(streamer)],
      });

    } catch (error) {
      console.error('Error viewing profile:', error);
      await interaction.editReply({
        embeds: [errorEmbed('Error', 'Failed to load profile. Please try again later.')],
      });
    }
  },

  async approveStreamer(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    
    if (!hasManagementPermission(member)) {
      return interaction.reply({
        embeds: [errorEmbed('Permission Denied', 'You do not have permission to approve streamers.')],
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
          embeds: [successEmbed('Streamer Updated', `${user} has been updated and activated.\nPlatform: ${platform}\nUsername: ${username}`)],
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
          embeds: [successEmbed('Streamer Approved', `${user} has been approved as a streamer!\nPlatform: ${platform}\nUsername: ${username}\nStarting Credits: 100`)],
        });
      }

    } catch (error) {
      console.error('Error approving streamer:', error);
      await interaction.editReply({
        embeds: [errorEmbed('Error', 'Failed to approve streamer. Please try again later.')],
      });
    }
  },

  async suspendStreamer(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    
    if (!hasManagementPermission(member)) {
      return interaction.reply({
        embeds: [errorEmbed('Permission Denied', 'You do not have permission to suspend streamers.')],
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
          embeds: [errorEmbed('Not Found', 'This user is not a streamer.')],
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
        embeds: [successEmbed('Streamer Suspended', `${user} has been suspended.\nReason: ${reason}`)],
      });

    } catch (error) {
      console.error('Error suspending streamer:', error);
      await interaction.editReply({
        embeds: [errorEmbed('Error', 'Failed to suspend streamer. Please try again later.')],
      });
    }
  },

  async reactivateStreamer(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    
    if (!hasManagementPermission(member)) {
      return interaction.reply({
        embeds: [errorEmbed('Permission Denied', 'You do not have permission to reactivate streamers.')],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      const user = interaction.options.getUser('user');

      const streamerData = database.getStreamer(user.id);
      
      if (!streamerData) {
        return interaction.editReply({
          embeds: [errorEmbed('Not Found', 'This user is not a streamer.')],
        });
      }

      const streamer = new Streamer(streamerData);
      streamer.status = 'active';
      
      database.saveStreamer(user.id, streamer);

      await interaction.editReply({
        embeds: [successEmbed('Streamer Reactivated', `${user} has been reactivated.`)],
      });

    } catch (error) {
      console.error('Error reactivating streamer:', error);
      await interaction.editReply({
        embeds: [errorEmbed('Error', 'Failed to reactivate streamer. Please try again later.')],
      });
    }
  },

  async listStreamers(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    
    if (!hasManagementPermission(member)) {
      return interaction.reply({
        embeds: [errorEmbed('Permission Denied', 'You do not have permission to list streamers.')],
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
          embeds: [successEmbed('Streamers', 'No streamers found.')],
        });
      }

      const streamerList = streamers.map(s => 
        `<@${s.userId}> - **${s.status}** - Credits: ${s.credits} - Platforms: ${Object.keys(s.platforms).join(', ')}`
      ).join('\n');

      await interaction.editReply({
        embeds: [successEmbed(`Streamers${status ? ` (${status})` : ''}`, streamerList)],
      });

    } catch (error) {
      console.error('Error listing streamers:', error);
      await interaction.editReply({
        embeds: [errorEmbed('Error', 'Failed to list streamers. Please try again later.')],
      });
    }
  },
};
