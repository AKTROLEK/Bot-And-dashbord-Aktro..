const cron = require('node-cron');
const config = require('../config');
const database = require('../utils/database');
const Streamer = require('../models/Streamer');
const { warningEmbed, errorEmbed } = require('../utils/embeds');

/**
 * Monitoring service for compliance checking and alerts
 */
class MonitorService {
  constructor(client) {
    this.client = client;
  }

  /**
   * Start all monitoring tasks
   */
  start() {
    console.log('✅ Starting monitoring service...');

    // Check compliance daily at 9 AM
    cron.schedule('0 9 * * *', () => {
      this.checkCompliance();
    });

    // Reset weekly stats every Monday at midnight
    cron.schedule('0 0 * * 1', () => {
      this.resetWeeklyStats();
    });

    // Reset monthly stats on the 1st of each month at midnight
    cron.schedule('0 0 1 * *', () => {
      this.resetMonthlyStats();
    });

    // Check for inactive streamers every day at noon
    cron.schedule('0 12 * * *', () => {
      this.checkInactiveStreamers();
    });

    console.log('✅ Monitoring tasks scheduled');
  }

  /**
   * Check if streamers are meeting platform requirements
   */
  async checkCompliance() {
    console.log('Running compliance check...');

    try {
      const allStreamers = database.getAllStreamers();
      const activeStreamers = Object.values(allStreamers).filter(s => s.status === 'active');

      for (const streamerData of activeStreamers) {
        const streamer = new Streamer(streamerData);

        // Check each platform
        for (const [platform, platformId] of Object.entries(streamer.platforms)) {
          const rules = config.platformRules[platform];
          if (!rules) continue;

          const meetsRequirements = streamer.meetsRequirements(platform, rules);

          if (!meetsRequirements) {
            // Add violation
            const weeklyStats = streamer.weeklyStats[platform] || {};
            const violation = {
              type: 'compliance',
              platform: platform,
              details: `Failed to meet requirements: ${weeklyStats.videos || 0}/${rules.minWeeklyVideos} videos, ${weeklyStats.streamHours || 0}/${rules.minWeeklyStreamHours} hours`,
            };

            streamer.addViolation(violation);
            database.saveStreamer(streamer.userId, streamer);

            // Send alert
            await this.sendAlert(
              '⚠️ Compliance Violation',
              `<@${streamer.userId}> did not meet requirements for **${platform}**\n\n` +
              `**Required:** ${rules.minWeeklyVideos} videos, ${rules.minWeeklyStreamHours} hours\n` +
              `**Actual:** ${weeklyStats.videos || 0} videos, ${weeklyStats.streamHours || 0} hours`
            );

            console.log(`Compliance violation recorded for ${streamer.username} on ${platform}`);
          }
        }
      }

      console.log('Compliance check completed');
    } catch (error) {
      console.error('Error checking compliance:', error);
    }
  }

  /**
   * Reset weekly statistics
   */
  async resetWeeklyStats() {
    console.log('Resetting weekly stats...');

    try {
      const allStreamers = database.getAllStreamers();

      for (const [userId, streamerData] of Object.entries(allStreamers)) {
        const streamer = new Streamer(streamerData);
        
        // Move weekly stats to monthly stats
        if (Object.keys(streamer.weeklyStats).length > 0) {
          for (const [platform, stats] of Object.entries(streamer.weeklyStats)) {
            if (!streamer.monthlyStats[platform]) {
              streamer.monthlyStats[platform] = { videos: 0, streamHours: 0, views: 0, engagement: 0 };
            }
            streamer.monthlyStats[platform].videos += stats.videos || 0;
            streamer.monthlyStats[platform].streamHours += stats.streamHours || 0;
            streamer.monthlyStats[platform].views += stats.views || 0;
            streamer.monthlyStats[platform].engagement += stats.engagement || 0;
          }
        }

        // Reset weekly stats
        streamer.weeklyStats = {};
        database.saveStreamer(userId, streamer);
      }

      console.log('Weekly stats reset completed');
    } catch (error) {
      console.error('Error resetting weekly stats:', error);
    }
  }

  /**
   * Reset monthly statistics
   */
  async resetMonthlyStats() {
    console.log('Resetting monthly stats...');

    try {
      const allStreamers = database.getAllStreamers();

      for (const [userId, streamerData] of Object.entries(allStreamers)) {
        const streamer = new Streamer(streamerData);
        streamer.monthlyStats = {};
        database.saveStreamer(userId, streamer);
      }

      console.log('Monthly stats reset completed');
    } catch (error) {
      console.error('Error resetting monthly stats:', error);
    }
  }

  /**
   * Check for inactive streamers
   */
  async checkInactiveStreamers() {
    console.log('Checking for inactive streamers...');

    try {
      const allStreamers = database.getAllStreamers();
      const activeStreamers = Object.values(allStreamers).filter(s => s.status === 'active');

      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

      for (const streamerData of activeStreamers) {
        const streamer = new Streamer(streamerData);

        // Check if streamer has any activity in weekly stats
        const hasActivity = Object.values(streamer.weeklyStats).some(stats => 
          (stats.videos || 0) > 0 || (stats.streamHours || 0) > 0
        );

        if (!hasActivity) {
          await this.sendAlert(
            '⚠️ Inactive Streamer',
            `<@${streamer.userId}> has had no activity this week on any platform.`
          );

          console.log(`Inactivity alert sent for ${streamer.username}`);
        }
      }

      console.log('Inactive streamer check completed');
    } catch (error) {
      console.error('Error checking inactive streamers:', error);
    }
  }

  /**
   * Send alert to alerts channel
   */
  async sendAlert(title, description) {
    try {
      if (!config.channels.alerts) return;

      const alertChannel = await this.client.channels.fetch(config.channels.alerts);
      if (!alertChannel) return;

      await alertChannel.send({
        embeds: [warningEmbed(title, description)],
      });
    } catch (error) {
      console.error('Error sending alert:', error);
    }
  }
}

module.exports = MonitorService;
