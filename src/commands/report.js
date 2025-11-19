const { SlashCommandBuilder } = require('discord.js');
const { reportEmbed, errorEmbed } = require('../utils/embeds');
const { canViewReports } = require('../utils/permissions');
const database = require('../utils/database');
const Streamer = require('../models/Streamer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Generate performance reports (Management only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('weekly')
        .setDescription('Generate weekly performance report'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('monthly')
        .setDescription('Generate monthly performance report'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('top')
        .setDescription('Show top performing streamers')
        .addIntegerOption(option =>
          option.setName('count')
            .setDescription('Number of top streamers to show')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('platform')
        .setDescription('Compare performance across platforms')),

  async execute(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    
    if (!canViewReports(member)) {
      return interaction.reply({
        embeds: [errorEmbed('Permission Denied', 'You do not have permission to view reports.')],
        ephemeral: true,
      });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'weekly') {
      await this.weeklyReport(interaction);
    } else if (subcommand === 'monthly') {
      await this.monthlyReport(interaction);
    } else if (subcommand === 'top') {
      await this.topStreamers(interaction);
    } else if (subcommand === 'platform') {
      await this.platformComparison(interaction);
    }
  },

  async weeklyReport(interaction) {
    await interaction.deferReply();

    try {
      const allStreamers = database.getAllStreamers();
      const streamers = Object.values(allStreamers).filter(s => s.status === 'active');

      if (streamers.length === 0) {
        return interaction.editReply({
          embeds: [errorEmbed('No Data', 'No active streamers found.')],
        });
      }

      // Calculate weekly stats
      let totalVideos = 0;
      let totalStreamHours = 0;
      let totalViews = 0;

      streamers.forEach(s => {
        const weeklyStats = s.weeklyStats || {};
        Object.values(weeklyStats).forEach(platformStats => {
          totalVideos += platformStats.videos || 0;
          totalStreamHours += platformStats.streamHours || 0;
          totalViews += platformStats.views || 0;
        });
      });

      const fields = [
        { name: 'Active Streamers', value: streamers.length.toString(), inline: true },
        { name: 'Total Videos', value: totalVideos.toString(), inline: true },
        { name: 'Total Stream Hours', value: totalStreamHours.toString(), inline: true },
        { name: 'Total Views', value: totalViews.toLocaleString(), inline: true },
        { name: 'Average Videos/Streamer', value: (totalVideos / streamers.length).toFixed(1), inline: true },
        { name: 'Average Hours/Streamer', value: (totalStreamHours / streamers.length).toFixed(1), inline: true },
      ];

      await interaction.editReply({
        embeds: [reportEmbed('Weekly Performance Report', { fields })],
      });

    } catch (error) {
      console.error('Error generating weekly report:', error);
      await interaction.editReply({
        embeds: [errorEmbed('Error', 'Failed to generate report. Please try again later.')],
      });
    }
  },

  async monthlyReport(interaction) {
    await interaction.deferReply();

    try {
      const allStreamers = database.getAllStreamers();
      const streamers = Object.values(allStreamers).filter(s => s.status === 'active');

      if (streamers.length === 0) {
        return interaction.editReply({
          embeds: [errorEmbed('No Data', 'No active streamers found.')],
        });
      }

      // Calculate monthly stats
      let totalVideos = 0;
      let totalStreamHours = 0;
      let totalViews = 0;
      let totalEngagement = 0;

      streamers.forEach(s => {
        const monthlyStats = s.monthlyStats || {};
        Object.values(monthlyStats).forEach(platformStats => {
          totalVideos += platformStats.videos || 0;
          totalStreamHours += platformStats.streamHours || 0;
          totalViews += platformStats.views || 0;
          totalEngagement += platformStats.engagement || 0;
        });
      });

      const fields = [
        { name: 'Active Streamers', value: streamers.length.toString(), inline: true },
        { name: 'Total Videos', value: totalVideos.toString(), inline: true },
        { name: 'Total Stream Hours', value: totalStreamHours.toString(), inline: true },
        { name: 'Total Views', value: totalViews.toLocaleString(), inline: true },
        { name: 'Total Engagement', value: totalEngagement.toLocaleString(), inline: true },
        { name: 'Average Engagement Rate', value: totalViews > 0 ? `${((totalEngagement / totalViews) * 100).toFixed(2)}%` : '0%', inline: true },
      ];

      await interaction.editReply({
        embeds: [reportEmbed('Monthly Performance Report', { fields })],
      });

    } catch (error) {
      console.error('Error generating monthly report:', error);
      await interaction.editReply({
        embeds: [errorEmbed('Error', 'Failed to generate report. Please try again later.')],
      });
    }
  },

  async topStreamers(interaction) {
    await interaction.deferReply();

    try {
      const count = interaction.options.getInteger('count') || 3;
      const allStreamers = database.getAllStreamers();
      const streamers = Object.values(allStreamers)
        .filter(s => s.status === 'active')
        .map(s => new Streamer(s));

      if (streamers.length === 0) {
        return interaction.editReply({
          embeds: [errorEmbed('No Data', 'No active streamers found.')],
        });
      }

      // Sort by total views
      streamers.sort((a, b) => {
        const aViews = a.stats.totalViews || 0;
        const bViews = b.stats.totalViews || 0;
        return bViews - aViews;
      });

      const topStreamers = streamers.slice(0, count);
      const description = topStreamers.map((s, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        return `${medal} <@${s.userId}> - ${s.stats.totalViews.toLocaleString()} views - ${s.stats.totalVideos} videos - ${s.stats.totalStreamHours}h`;
      }).join('\n');

      await interaction.editReply({
        embeds: [reportEmbed(`Top ${count} Streamers`, { description })],
      });

    } catch (error) {
      console.error('Error generating top streamers:', error);
      await interaction.editReply({
        embeds: [errorEmbed('Error', 'Failed to generate report. Please try again later.')],
      });
    }
  },

  async platformComparison(interaction) {
    await interaction.deferReply();

    try {
      const allStreamers = database.getAllStreamers();
      const streamers = Object.values(allStreamers).filter(s => s.status === 'active');

      if (streamers.length === 0) {
        return interaction.editReply({
          embeds: [errorEmbed('No Data', 'No active streamers found.')],
        });
      }

      const platformStats = {
        youtube: { streamers: 0, videos: 0, hours: 0, views: 0 },
        twitch: { streamers: 0, videos: 0, hours: 0, views: 0 },
        tiktok: { streamers: 0, videos: 0, hours: 0, views: 0 },
      };

      streamers.forEach(s => {
        Object.keys(s.platforms || {}).forEach(platform => {
          if (platformStats[platform]) {
            platformStats[platform].streamers++;
            const stats = s.stats[platform] || {};
            platformStats[platform].videos += stats.videos || 0;
            platformStats[platform].hours += stats.streamHours || 0;
            platformStats[platform].views += stats.views || 0;
          }
        });
      });

      const fields = [];
      Object.keys(platformStats).forEach(platform => {
        const stats = platformStats[platform];
        if (stats.streamers > 0) {
          fields.push({
            name: platform.toUpperCase(),
            value: `Streamers: ${stats.streamers}\nVideos: ${stats.videos}\nHours: ${stats.hours}\nViews: ${stats.views.toLocaleString()}`,
            inline: true,
          });
        }
      });

      if (fields.length === 0) {
        return interaction.editReply({
          embeds: [errorEmbed('No Data', 'No platform data available.')],
        });
      }

      await interaction.editReply({
        embeds: [reportEmbed('Platform Comparison', { fields })],
      });

    } catch (error) {
      console.error('Error generating platform comparison:', error);
      await interaction.editReply({
        embeds: [errorEmbed('Error', 'Failed to generate report. Please try again later.')],
      });
    }
  },
};
