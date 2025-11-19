const axios = require('axios');
const config = require('../config');

class TwitchService {
  constructor() {
    this.clientId = config.platforms.twitch.clientId;
    this.clientSecret = config.platforms.twitch.clientSecret;
    this.accessToken = null;
    this.baseUrl = 'https://api.twitch.tv/helix';
  }

  /**
   * Get OAuth access token
   */
  async getAccessToken() {
    if (this.accessToken) return this.accessToken;

    try {
      const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials',
        },
      });

      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('Twitch Auth Error:', error.message);
      return null;
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(username) {
    try {
      const token = await this.getAccessToken();
      if (!token) return null;

      const response = await axios.get(`${this.baseUrl}/users`, {
        params: { login: username },
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.data && response.data.data.length > 0) {
        const user = response.data.data[0];
        return {
          id: user.id,
          login: user.login,
          displayName: user.display_name,
          viewCount: user.view_count,
          profileImageUrl: user.profile_image_url,
        };
      }

      return null;
    } catch (error) {
      console.error('Twitch API Error:', error.message);
      return null;
    }
  }

  /**
   * Check if user is currently streaming
   */
  async isUserLive(username) {
    try {
      const token = await this.getAccessToken();
      if (!token) return false;

      const response = await axios.get(`${this.baseUrl}/streams`, {
        params: { user_login: username },
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.data.data && response.data.data.length > 0;
    } catch (error) {
      console.error('Twitch API Error:', error.message);
      return false;
    }
  }

  /**
   * Get stream information
   */
  async getStreamInfo(username) {
    try {
      const token = await this.getAccessToken();
      if (!token) return null;

      const response = await axios.get(`${this.baseUrl}/streams`, {
        params: { user_login: username },
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.data && response.data.data.length > 0) {
        const stream = response.data.data[0];
        return {
          title: stream.title,
          viewerCount: stream.viewer_count,
          startedAt: new Date(stream.started_at),
          gameName: stream.game_name,
          thumbnailUrl: stream.thumbnail_url,
        };
      }

      return null;
    } catch (error) {
      console.error('Twitch API Error:', error.message);
      return null;
    }
  }

  /**
   * Get recent videos (VODs)
   */
  async getRecentVideos(userId, maxResults = 10) {
    try {
      const token = await this.getAccessToken();
      if (!token) return [];

      const response = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          user_id: userId,
          first: maxResults,
        },
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.data) {
        return response.data.data.map(video => ({
          id: video.id,
          title: video.title,
          viewCount: video.view_count,
          createdAt: new Date(video.created_at),
          duration: video.duration,
          thumbnailUrl: video.thumbnail_url,
        }));
      }

      return [];
    } catch (error) {
      console.error('Twitch API Error:', error.message);
      return [];
    }
  }
}

module.exports = new TwitchService();
