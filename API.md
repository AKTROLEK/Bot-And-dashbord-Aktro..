# REST API Documentation

The bot includes a REST API for external integrations, allowing you to interact with the bot programmatically.

## Base URL

```
http://localhost:3000
```

For production, use your server's URL.

## Authentication

Most endpoints require authentication using an API key.

### API Key Authentication

Include the API key in the request header:

```
X-API-Key: your_api_secret_from_env
```

### Webhook Authentication

Webhook endpoints require a webhook secret:

```
X-Webhook-Secret: your_webhook_secret_from_env
```

## Endpoints

### Health Check

Check if the API is running.

**Endpoint:** `GET /health`

**Authentication:** None required

**Response:**
```json
{
  "status": "healthy",
  "uptime": 12345.67,
  "timestamp": "2024-11-19T12:00:00.000Z"
}
```

---

### Get All Streamers

Retrieve a list of all streamers.

**Endpoint:** `GET /api/streamers`

**Authentication:** Required (X-API-Key)

**Response:**
```json
{
  "streamers": [
    {
      "userId": "123456789",
      "username": "streamer1",
      "platforms": {
        "youtube": "UCxxx",
        "twitch": "streamer1"
      },
      "credits": 150,
      "status": "active",
      "stats": {
        "totalVideos": 25,
        "totalStreamHours": 100,
        "totalViews": 50000,
        "totalEngagement": 5000
      },
      "weeklyStats": {},
      "monthlyStats": {},
      "violations": [],
      "achievements": []
    }
  ]
}
```

---

### Get Specific Streamer

Retrieve information about a specific streamer.

**Endpoint:** `GET /api/streamers/:userId`

**Authentication:** Required (X-API-Key)

**Parameters:**
- `userId` (path) - Discord user ID

**Response:**
```json
{
  "streamer": {
    "userId": "123456789",
    "username": "streamer1",
    "platforms": {
      "youtube": "UCxxx",
      "twitch": "streamer1"
    },
    "credits": 150,
    "status": "active",
    "stats": {
      "totalVideos": 25,
      "totalStreamHours": 100,
      "totalViews": 50000
    }
  }
}
```

**Error Response (404):**
```json
{
  "error": "Streamer not found"
}
```

---

### Update Streamer Stats

Update statistics for a specific streamer.

**Endpoint:** `POST /api/streamers/:userId/stats`

**Authentication:** Required (X-API-Key)

**Parameters:**
- `userId` (path) - Discord user ID

**Request Body:**
```json
{
  "platform": "youtube",
  "stats": {
    "videos": 5,
    "streamHours": 10,
    "views": 5000,
    "engagement": 500
  }
}
```

**Response:**
```json
{
  "success": true,
  "streamer": {
    "userId": "123456789",
    "username": "streamer1",
    "stats": {
      "youtube": {
        "videos": 5,
        "streamHours": 10,
        "views": 5000,
        "engagement": 500
      }
    }
  }
}
```

**Error Response (400):**
```json
{
  "error": "Missing platform or stats"
}
```

---

### Get Tickets

Retrieve tickets with optional filtering.

**Endpoint:** `GET /api/tickets`

**Authentication:** Required (X-API-Key)

**Query Parameters:**
- `status` (optional) - Filter by status (open, in-progress, closed)
- `userId` (optional) - Filter by user ID

**Examples:**
```
GET /api/tickets?status=open
GET /api/tickets?userId=123456789
GET /api/tickets?status=open&userId=123456789
```

**Response:**
```json
{
  "tickets": [
    {
      "id": "ticket-1700000000000",
      "type": "application",
      "userId": "123456789",
      "username": "user1",
      "channelId": "987654321",
      "status": "open",
      "priority": "normal",
      "createdAt": "2024-11-19T12:00:00.000Z",
      "messages": [],
      "assignedTo": null,
      "metadata": {
        "platform": "youtube",
        "platformUsername": "channel1",
        "reason": "I want to join"
      }
    }
  ]
}
```

---

### Platform Event Webhook

Receive notifications about platform events (video uploads, stream starts/ends).

**Endpoint:** `POST /webhook/platform-event`

**Authentication:** Required (X-Webhook-Secret)

**Request Body:**
```json
{
  "platform": "youtube",
  "event": "video_uploaded",
  "userId": "123456789",
  "data": {
    "url": "https://youtube.com/watch?v=xxx",
    "title": "My Video",
    "videoId": "xxx"
  }
}
```

**Supported Events:**

#### video_uploaded

Triggered when a streamer uploads a new video.

```json
{
  "platform": "youtube",
  "event": "video_uploaded",
  "userId": "discord_user_id",
  "data": {
    "url": "https://youtube.com/watch?v=xxx",
    "title": "Video Title",
    "videoId": "xxx"
  }
}
```

**Bot Actions:**
- Awards 10 credits to the streamer
- Updates weekly stats (videos count)
- Sends alert to alerts channel

#### stream_started

Triggered when a streamer starts a live stream.

```json
{
  "platform": "twitch",
  "event": "stream_started",
  "userId": "discord_user_id",
  "data": {
    "url": "https://twitch.tv/username",
    "title": "Stream Title"
  }
}
```

**Bot Actions:**
- Sends alert to alerts channel

#### stream_ended

Triggered when a streamer ends a live stream.

```json
{
  "platform": "twitch",
  "event": "stream_ended",
  "userId": "discord_user_id",
  "data": {
    "durationMinutes": 120,
    "viewerCount": 500,
    "url": "https://twitch.tv/username"
  }
}
```

**Bot Actions:**
- Awards credits based on stream duration (5 credits/hour)
- Updates weekly stats (stream hours, views)

**Response:**
```json
{
  "success": true
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized

Authentication failed or missing credentials.

```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found

Requested resource not found.

```json
{
  "error": "Streamer not found"
}
```

### 500 Internal Server Error

Server encountered an error processing the request.

```json
{
  "error": "Internal server error"
}
```

---

## Usage Examples

### cURL Examples

#### Get All Streamers

```bash
curl -X GET http://localhost:3000/api/streamers \
  -H "X-API-Key: your_api_secret"
```

#### Get Specific Streamer

```bash
curl -X GET http://localhost:3000/api/streamers/123456789 \
  -H "X-API-Key: your_api_secret"
```

#### Update Streamer Stats

```bash
curl -X POST http://localhost:3000/api/streamers/123456789/stats \
  -H "X-API-Key: your_api_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "youtube",
    "stats": {
      "videos": 5,
      "streamHours": 10,
      "views": 5000
    }
  }'
```

#### Send Video Upload Event

```bash
curl -X POST http://localhost:3000/webhook/platform-event \
  -H "X-Webhook-Secret: your_webhook_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "youtube",
    "event": "video_uploaded",
    "userId": "123456789",
    "data": {
      "url": "https://youtube.com/watch?v=xxx",
      "title": "My New Video"
    }
  }'
```

### JavaScript/Node.js Examples

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000';
const API_KEY = 'your_api_secret';

// Get all streamers
async function getAllStreamers() {
  try {
    const response = await axios.get(`${API_URL}/api/streamers`, {
      headers: { 'X-API-Key': API_KEY }
    });
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// Update streamer stats
async function updateStats(userId, platform, stats) {
  try {
    const response = await axios.post(
      `${API_URL}/api/streamers/${userId}/stats`,
      { platform, stats },
      { headers: { 'X-API-Key': API_KEY } }
    );
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// Send webhook event
async function sendVideoUploadEvent(userId, videoData) {
  try {
    const response = await axios.post(
      `${API_URL}/webhook/platform-event`,
      {
        platform: 'youtube',
        event: 'video_uploaded',
        userId,
        data: videoData
      },
      { headers: { 'X-Webhook-Secret': 'your_webhook_secret' } }
    );
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}
```

### Python Examples

```python
import requests

API_URL = 'http://localhost:3000'
API_KEY = 'your_api_secret'

# Get all streamers
def get_all_streamers():
    response = requests.get(
        f'{API_URL}/api/streamers',
        headers={'X-API-Key': API_KEY}
    )
    return response.json()

# Update streamer stats
def update_stats(user_id, platform, stats):
    response = requests.post(
        f'{API_URL}/api/streamers/{user_id}/stats',
        json={'platform': platform, 'stats': stats},
        headers={'X-API-Key': API_KEY}
    )
    return response.json()

# Send webhook event
def send_video_upload_event(user_id, video_data):
    response = requests.post(
        f'{API_URL}/webhook/platform-event',
        json={
            'platform': 'youtube',
            'event': 'video_uploaded',
            'userId': user_id,
            'data': video_data
        },
        headers={'X-Webhook-Secret': 'your_webhook_secret'}
    )
    return response.json()
```

---

## Integration Examples

### YouTube Webhook Integration

You can use YouTube's PubSubHubbub to receive notifications when a channel uploads a video:

1. Subscribe to the YouTube channel feed
2. When receiving a notification, parse the video data
3. Send a webhook to your bot's API

### Twitch EventSub Integration

Use Twitch's EventSub to receive stream notifications:

1. Subscribe to `stream.online` and `stream.offline` events
2. When receiving a notification, extract stream data
3. Send a webhook to your bot's API

### Custom Integration

Create your own service that:

1. Monitors platform APIs for changes
2. Detects new videos/streams
3. Sends webhooks to the bot's API
4. Updates streamer statistics

---

## Rate Limiting

The API does not currently implement rate limiting, but consider adding it for production:

- Recommended: 100 requests per minute per IP
- Use Redis or in-memory store to track requests
- Return 429 Too Many Requests when limit exceeded

---

## Security Best Practices

1. **Use HTTPS** in production
2. **Rotate API keys** regularly
3. **Whitelist IP addresses** for webhook endpoints
4. **Validate webhook signatures** if implementing custom webhooks
5. **Monitor API logs** for suspicious activity
6. **Use strong secrets** (32+ characters, random)
7. **Don't expose API publicly** unless necessary

---

## Support

For API support or questions:

1. Check this documentation
2. Review the [README.md](./README.md)
3. Open an issue on GitHub
4. Contact the development team

---

## Changelog

### v1.0.0 (2024-11-19)
- Initial API release
- Basic CRUD operations for streamers
- Webhook support for platform events
- Health check endpoint
- Ticket management endpoints
