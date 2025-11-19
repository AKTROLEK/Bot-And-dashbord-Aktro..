class Streamer {
  constructor(data = {}) {
    this.userId = data.userId;
    this.username = data.username;
    this.platforms = data.platforms || {}; // { youtube: 'channelId', twitch: 'username', tiktok: 'username' }
    this.credits = data.credits || 0;
    this.status = data.status || 'pending'; // pending, active, suspended
    this.joinedAt = data.joinedAt || new Date();
    this.stats = data.stats || {
      totalVideos: 0,
      totalStreamHours: 0,
      totalViews: 0,
      totalEngagement: 0,
    };
    this.weeklyStats = data.weeklyStats || {};
    this.monthlyStats = data.monthlyStats || {};
    this.violations = data.violations || [];
    this.achievements = data.achievements || [];
  }

  // Add credits
  addCredits(amount, reason) {
    this.credits += amount;
    return {
      newBalance: this.credits,
      amount,
      reason,
      timestamp: new Date(),
    };
  }

  // Deduct credits
  deductCredits(amount, reason) {
    if (this.credits >= amount) {
      this.credits -= amount;
      return {
        success: true,
        newBalance: this.credits,
        amount,
        reason,
        timestamp: new Date(),
      };
    }
    return {
      success: false,
      message: 'Insufficient credits',
    };
  }

  // Add violation
  addViolation(violation) {
    this.violations.push({
      ...violation,
      timestamp: new Date(),
    });
  }

  // Update statistics
  updateStats(platform, stats) {
    if (!this.stats[platform]) {
      this.stats[platform] = {};
    }
    Object.assign(this.stats[platform], stats);
  }

  // Check if meets platform requirements
  meetsRequirements(platform, rules) {
    const platformStats = this.weeklyStats[platform] || {};
    
    if (rules.minWeeklyVideos && (platformStats.videos || 0) < rules.minWeeklyVideos) {
      return false;
    }
    
    if (rules.minWeeklyStreamHours && (platformStats.streamHours || 0) < rules.minWeeklyStreamHours) {
      return false;
    }
    
    return true;
  }

  // Get performance summary
  getPerformanceSummary() {
    return {
      userId: this.userId,
      username: this.username,
      credits: this.credits,
      status: this.status,
      stats: this.stats,
      platforms: Object.keys(this.platforms),
      violationCount: this.violations.length,
      achievementCount: this.achievements.length,
    };
  }
}

module.exports = Streamer;
