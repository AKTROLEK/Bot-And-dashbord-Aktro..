const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../utils/embeds');
const { canAdjustCredits } = require('../utils/permissions');
const database = require('../utils/database');
const Streamer = require('../models/Streamer');
const { t } = require('../utils/localization');

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
          embeds: [errorEmbed(t('NOT_FOUND'), t('NO_STREAMER_PROFILE'))],
        });
      }

      const streamer = new Streamer(streamerData);
      
      await interaction.editReply({
        embeds: [successEmbed(t('CREDIT_BALANCE'), `**${t('USER')}:** ${targetUser || interaction.user}\n**${t('BALANCE')}:** 💰 ${streamer.credits} ${t('CREDITS')}`)],
      });

    } catch (error) {
      console.error('Error checking balance:', error);
      await interaction.editReply({
        embeds: [errorEmbed(t('ERROR'), t('FAILED_CHECK_BALANCE'))],
      });
    }
  },

  async addCredits(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    
    if (!canAdjustCredits(member)) {
      return interaction.reply({
        embeds: [errorEmbed(t('PERMISSION_DENIED'), t('NO_PERMISSION_ADJUST_CREDITS'))],
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
          embeds: [errorEmbed(t('NOT_FOUND'), t('NOT_A_STREAMER'))],
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
        embeds: [successEmbed(t('CREDITS_ADDED'), `${t('ADDED_CREDITS')} 💰 ${amount} ${t('CREDITS_TO')} ${user}\n**${t('REASON')}:** ${reason}\n**${t('NEW_BALANCE')}:** 💰 ${result.newBalance}`)],
      });

    } catch (error) {
      console.error('Error adding credits:', error);
      await interaction.editReply({
        embeds: [errorEmbed(t('ERROR'), t('FAILED_ADD_CREDITS'))],
      });
    }
  },

  async deductCredits(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    
    if (!canAdjustCredits(member)) {
      return interaction.reply({
        embeds: [errorEmbed(t('PERMISSION_DENIED'), t('NO_PERMISSION_ADJUST_CREDITS'))],
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
          embeds: [errorEmbed(t('NOT_FOUND'), t('NOT_A_STREAMER'))],
        });
      }

      const streamer = new Streamer(streamerData);
      const result = streamer.deductCredits(amount, reason);
      
      if (!result.success) {
        return interaction.editReply({
          embeds: [errorEmbed(t('INSUFFICIENT_CREDITS'), `${user} ${t('NOT_ENOUGH_CREDITS')}\n${t('CURRENT_BALANCE')}: 💰 ${streamer.credits}`)],
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
        embeds: [successEmbed(t('CREDITS_DEDUCTED'), `${t('DEDUCTED_CREDITS')} 💰 ${amount} ${t('CREDITS_FROM')} ${user}\n**${t('REASON')}:** ${reason}\n**${t('NEW_BALANCE')}:** 💰 ${result.newBalance}`)],
      });

    } catch (error) {
      console.error('Error deducting credits:', error);
      await interaction.editReply({
        embeds: [errorEmbed(t('ERROR'), t('FAILED_DEDUCT_CREDITS'))],
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
          embeds: [errorEmbed(t('PERMISSION_DENIED'), t('CAN_ONLY_VIEW_OWN_HISTORY'))],
          ephemeral: true,
        });
      }
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const history = database.getCreditHistory(userId);
      
      if (history.length === 0) {
        return interaction.editReply({
          embeds: [successEmbed(t('CREDIT_HISTORY'), t('NO_TRANSACTION_HISTORY'))],
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
        embeds: [successEmbed(t('CREDIT_HISTORY_LAST_10'), historyText)],
      });

    } catch (error) {
      console.error('Error viewing history:', error);
      await interaction.editReply({
        embeds: [errorEmbed(t('ERROR'), t('FAILED_LOAD_HISTORY'))],
      });
    }
  },
};
