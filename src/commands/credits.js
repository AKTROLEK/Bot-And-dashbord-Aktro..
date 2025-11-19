const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../utils/embeds');
const { canAdjustCredits } = require('../utils/permissions');
const database = require('../utils/database');
const Streamer = require('../models/Streamer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('credits')
    .setDescription('Credit management commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('balance')
        .setDescription('Check your credit balance or another streamer\'s balance')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to check balance for (Management only)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add credits to a streamer (Management only)')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to add credits to')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('Amount of credits to add')
            .setRequired(true)
            .setMinValue(1))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for adding credits')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('deduct')
        .setDescription('Deduct credits from a streamer (Management only)')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to deduct credits from')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('Amount of credits to deduct')
            .setRequired(true)
            .setMinValue(1))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for deducting credits')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('history')
        .setDescription('View credit transaction history')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to view history for (Management only)')
            .setRequired(false))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'balance') {
      await this.checkBalance(interaction);
    } else if (subcommand === 'add') {
      await this.addCredits(interaction);
    } else if (subcommand === 'deduct') {
      await this.deductCredits(interaction);
    } else if (subcommand === 'history') {
      await this.viewHistory(interaction);
    }
  },

  async checkBalance(interaction) {
    const targetUser = interaction.options.getUser('user');
    const userId = targetUser ? targetUser.id : interaction.user.id;
    
    await interaction.deferReply({ ephemeral: true });

    try {
      const streamerData = database.getStreamer(userId);
      
      if (!streamerData) {
        return interaction.editReply({
          embeds: [errorEmbed('Not Found', 'No streamer profile found.')],
        });
      }

      const streamer = new Streamer(streamerData);
      
      await interaction.editReply({
        embeds: [successEmbed('Credit Balance', `**User:** ${targetUser || interaction.user}\n**Balance:** 💰 ${streamer.credits} credits`)],
      });

    } catch (error) {
      console.error('Error checking balance:', error);
      await interaction.editReply({
        embeds: [errorEmbed('Error', 'Failed to check balance. Please try again later.')],
      });
    }
  },

  async addCredits(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    
    if (!canAdjustCredits(member)) {
      return interaction.reply({
        embeds: [errorEmbed('Permission Denied', 'You do not have permission to adjust credits.')],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      const user = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');
      const reason = interaction.options.getString('reason');

      const streamerData = database.getStreamer(user.id);
      
      if (!streamerData) {
        return interaction.editReply({
          embeds: [errorEmbed('Not Found', 'This user is not a streamer.')],
        });
      }

      const streamer = new Streamer(streamerData);
      const result = streamer.addCredits(amount, reason);
      
      database.saveStreamer(user.id, streamer);
      
      // Log transaction
      database.addCreditHistory({
        userId: user.id,
        amount: amount,
        type: 'add',
        reason: reason,
        performedBy: interaction.user.id,
        newBalance: result.newBalance,
      });

      await interaction.editReply({
        embeds: [successEmbed('Credits Added', `Added 💰 ${amount} credits to ${user}\n**Reason:** ${reason}\n**New Balance:** 💰 ${result.newBalance}`)],
      });

    } catch (error) {
      console.error('Error adding credits:', error);
      await interaction.editReply({
        embeds: [errorEmbed('Error', 'Failed to add credits. Please try again later.')],
      });
    }
  },

  async deductCredits(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    
    if (!canAdjustCredits(member)) {
      return interaction.reply({
        embeds: [errorEmbed('Permission Denied', 'You do not have permission to adjust credits.')],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      const user = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');
      const reason = interaction.options.getString('reason');

      const streamerData = database.getStreamer(user.id);
      
      if (!streamerData) {
        return interaction.editReply({
          embeds: [errorEmbed('Not Found', 'This user is not a streamer.')],
        });
      }

      const streamer = new Streamer(streamerData);
      const result = streamer.deductCredits(amount, reason);
      
      if (!result.success) {
        return interaction.editReply({
          embeds: [errorEmbed('Insufficient Credits', `${user} does not have enough credits.\nCurrent Balance: 💰 ${streamer.credits}`)],
        });
      }

      database.saveStreamer(user.id, streamer);
      
      // Log transaction
      database.addCreditHistory({
        userId: user.id,
        amount: -amount,
        type: 'deduct',
        reason: reason,
        performedBy: interaction.user.id,
        newBalance: result.newBalance,
      });

      await interaction.editReply({
        embeds: [successEmbed('Credits Deducted', `Deducted 💰 ${amount} credits from ${user}\n**Reason:** ${reason}\n**New Balance:** 💰 ${result.newBalance}`)],
      });

    } catch (error) {
      console.error('Error deducting credits:', error);
      await interaction.editReply({
        embeds: [errorEmbed('Error', 'Failed to deduct credits. Please try again later.')],
      });
    }
  },

  async viewHistory(interaction) {
    const targetUser = interaction.options.getUser('user');
    const userId = targetUser ? targetUser.id : interaction.user.id;
    
    // Check permissions for viewing others' history
    if (targetUser && targetUser.id !== interaction.user.id) {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!canAdjustCredits(member)) {
        return interaction.reply({
          embeds: [errorEmbed('Permission Denied', 'You can only view your own history.')],
          ephemeral: true,
        });
      }
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const history = database.getCreditHistory(userId);
      
      if (history.length === 0) {
        return interaction.editReply({
          embeds: [successEmbed('Credit History', 'No transaction history found.')],
        });
      }

      // Show last 10 transactions
      const recentHistory = history.slice(-10).reverse();
      const historyText = recentHistory.map(entry => {
        const sign = entry.amount >= 0 ? '+' : '';
        const timestamp = new Date(entry.timestamp);
        return `${sign}${entry.amount} - ${entry.reason} - <t:${Math.floor(timestamp.getTime() / 1000)}:R>`;
      }).join('\n');

      await interaction.editReply({
        embeds: [successEmbed('Credit History (Last 10)', historyText)],
      });

    } catch (error) {
      console.error('Error viewing history:', error);
      await interaction.editReply({
        embeds: [errorEmbed('Error', 'Failed to load history. Please try again later.')],
      });
    }
  },
};
