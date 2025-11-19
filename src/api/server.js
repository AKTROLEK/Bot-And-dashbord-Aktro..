const express = require('express');
const config = require('../config');
const database = require('../utils/database');
const Streamer = require('../models/Streamer');

/**
 * REST API Server for external integrations
 */
function startAPI(client) {
  const app = express();
  app.use(express.json());

  // Authentication middleware
  const authenticate = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== config.api.secret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Get all streamers
  app.get('/api/streamers', authenticate, (req, res) => {
    try {
      const streamers = database.getAllStreamers();
      res.json({ streamers: Object.values(streamers) });
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get specific streamer
  app.get('/api/streamers/:userId', authenticate, (req, res) => {
    try {
      const streamer = database.getStreamer(req.params.userId);
      if (!streamer) {
        return res.status(404).json({ error: 'Streamer not found' });
      }
      res.json({ streamer });
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update streamer stats
  app.post('/api/streamers/:userId/stats', authenticate, (req, res) => {
    try {
      const streamerData = database.getStreamer(req.params.userId);
      if (!streamerData) {
        return res.status(404).json({ error: 'Streamer not found' });
      }

      const streamer = new Streamer(streamerData);
      const { platform, stats } = req.body;

      if (!platform || !stats) {
        return res.status(400).json({ error: 'Missing platform or stats' });
      }

      streamer.updateStats(platform, stats);
      database.saveStreamer(req.params.userId, streamer);

      res.json({ success: true, streamer });
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Webhook endpoint for platform events
  app.post('/webhook/platform-event', (req, res) => {
    try {
      const webhookSecret = req.headers['x-webhook-secret'];
      if (webhookSecret !== config.webhook.secret) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { platform, event, userId, data } = req.body;

      console.log(`Webhook received: ${platform} - ${event} - ${userId}`);

      // Handle different event types
      switch (event) {
        case 'video_uploaded':
          handleVideoUpload(client, userId, platform, data);
          break;
        case 'stream_started':
          handleStreamStart(client, userId, platform, data);
          break;
        case 'stream_ended':
          handleStreamEnd(client, userId, platform, data);
          break;
        default:
          console.log(`Unknown event type: ${event}`);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Webhook Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get tickets
  app.get('/api/tickets', authenticate, (req, res) => {
    try {
      const { status, userId } = req.query;
      let tickets;

      if (userId) {
        tickets = database.getTicketsByUser(userId);
      } else if (status) {
        tickets = database.getTicketsByStatus(status);
      } else {
        tickets = Object.values(database.getAllTickets());
      }

      res.json({ tickets });
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Start server
  const port = config.api.port;
  app.listen(port, () => {
    console.log(`✅ REST API server started on port ${port}`);
  });

  return app;
}

/**
 * Handle video upload event
 */
async function handleVideoUpload(client, userId, platform, data) {
  try {
    const streamerData = database.getStreamer(userId);
    if (!streamerData) return;

    const streamer = new Streamer(streamerData);
    
    // Add credits for video upload
    streamer.addCredits(config.credits.videoUpload, `Video uploaded on ${platform}`);
    
    // Update stats
    if (!streamer.weeklyStats[platform]) {
      streamer.weeklyStats[platform] = { videos: 0, streamHours: 0, views: 0 };
    }
    streamer.weeklyStats[platform].videos++;
    streamer.stats.totalVideos++;
    
    database.saveStreamer(userId, streamer);

    // Send alert to alerts channel
    if (config.channels.alerts) {
      const alertChannel = await client.channels.fetch(config.channels.alerts);
      if (alertChannel) {
        await alertChannel.send({
          content: `🎥 New video uploaded by <@${userId}> on **${platform}**!\n${data.url || ''}`,
        });
      }
    }

    console.log(`Video upload processed for user ${userId} on ${platform}`);
  } catch (error) {
    console.error('Error handling video upload:', error);
  }
}

/**
 * Handle stream start event
 */
async function handleStreamStart(client, userId, platform, data) {
  try {
    // Send alert to alerts channel
    if (config.channels.alerts) {
      const alertChannel = await client.channels.fetch(config.channels.alerts);
      if (alertChannel) {
        await alertChannel.send({
          content: `🔴 <@${userId}> is now live on **${platform}**!\n${data.url || ''}`,
        });
      }
    }

    console.log(`Stream start processed for user ${userId} on ${platform}`);
  } catch (error) {
    console.error('Error handling stream start:', error);
  }
}

/**
 * Handle stream end event
 */
async function handleStreamEnd(client, userId, platform, data) {
  try {
    const streamerData = database.getStreamer(userId);
    if (!streamerData) return;

    const streamer = new Streamer(streamerData);
    
    // Calculate stream duration in hours
    const durationHours = data.durationMinutes ? data.durationMinutes / 60 : 0;
    
    // Add credits for streaming
    const creditsEarned = Math.floor(durationHours * config.credits.streamHour);
    if (creditsEarned > 0) {
      streamer.addCredits(creditsEarned, `Streamed ${durationHours.toFixed(1)}h on ${platform}`);
    }
    
    // Update stats
    if (!streamer.weeklyStats[platform]) {
      streamer.weeklyStats[platform] = { videos: 0, streamHours: 0, views: 0 };
    }
    streamer.weeklyStats[platform].streamHours += durationHours;
    streamer.stats.totalStreamHours += durationHours;
    
    if (data.viewerCount) {
      streamer.weeklyStats[platform].views += data.viewerCount;
      streamer.stats.totalViews += data.viewerCount;
    }
    
    database.saveStreamer(userId, streamer);

    console.log(`Stream end processed for user ${userId} on ${platform}`);
  } catch (error) {
    console.error('Error handling stream end:', error);
  }
}

module.exports = { startAPI };
