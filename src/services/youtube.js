const axios = require('axios');
const config = require('../config');

class YouTubeService {
  constructor() {
    this.apiKey = config.platforms.youtube.apiKey;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  /**
   * Get channel statistics
   */
  async getChannelStats(channelId) {
    try {
      const response = await axios.get(`${this.baseUrl}/channels`, {
        params: {
          key: this.apiKey,
          id: channelId,
          part: 'statistics,snippet',
        },
      });

      if (response.data.items && response.data.items.length > 0) {
        const channel = response.data.items[0];
        return {
          title: channel.snippet.title,
          subscriberCount: parseInt(channel.statistics.subscriberCount),
          viewCount: parseInt(channel.statistics.viewCount),
          videoCount: parseInt(channel.statistics.videoCount),
        };
      }

      return null;
    } catch (error) {
      console.error('YouTube API Error:', error.message);
      return null;
    }
  }

  /**
   * Get recent videos from a channel
   */
  async getRecentVideos(channelId, maxResults = 10) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          key: this.apiKey,
          channelId: channelId,
          part: 'snippet',
          order: 'date',
          maxResults: maxResults,
          type: 'video',
        },
      });

      if (response.data.items) {
        return response.data.items.map(item => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          publishedAt: new Date(item.snippet.publishedAt),
          thumbnail: item.snippet.thumbnails.default.url,
        }));
      }

      return [];
    } catch (error) {
      console.error('YouTube API Error:', error.message);
      return [];
    }
  }

  /**
   * Get video statistics
   */
  async getVideoStats(videoId) {
    try {
      const response = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          key: this.apiKey,
          id: videoId,
          part: 'statistics,snippet,contentDetails',
        },
      });

      if (response.data.items && response.data.items.length > 0) {
        const video = response.data.items[0];
        return {
          title: video.snippet.title,
          viewCount: parseInt(video.statistics.viewCount),
          likeCount: parseInt(video.statistics.likeCount || 0),
          commentCount: parseInt(video.statistics.commentCount || 0),
          duration: video.contentDetails.duration,
        };
      }

      return null;
    } catch (error) {
      console.error('YouTube API Error:', error.message);
      return null;
    }
  }

  /**
   * Check if channel is currently live
   */
  async isChannelLive(channelId) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          key: this.apiKey,
          channelId: channelId,
          part: 'snippet',
          eventType: 'live',
          type: 'video',
        },
      });

      return response.data.items && response.data.items.length > 0;
    } catch (error) {
      console.error('YouTube API Error:', error.message);
      return false;
    }
  }
}

module.exports = new YouTubeService();
