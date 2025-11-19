const fs = require('fs');
const path = require('path');

/**
 * Simple JSON-based database manager
 * This can be replaced with a proper database (MongoDB, PostgreSQL, etc.) in production
 */
class Database {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.streamerFile = path.join(this.dataDir, 'streamers.json');
    this.ticketFile = path.join(this.dataDir, 'tickets.json');
    this.creditHistoryFile = path.join(this.dataDir, 'credit-history.json');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // Initialize files if they don't exist
    this.initFile(this.streamerFile, {});
    this.initFile(this.ticketFile, {});
    this.initFile(this.creditHistoryFile, []);
  }

  initFile(filePath, defaultData) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    }
  }

  readFile(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  }

  writeFile(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
      return false;
    }
  }

  // Streamer operations
  getStreamer(userId) {
    const streamers = this.readFile(this.streamerFile);
    return streamers[userId] || null;
  }

  getAllStreamers() {
    return this.readFile(this.streamerFile);
  }

  saveStreamer(userId, data) {
    const streamers = this.readFile(this.streamerFile);
    streamers[userId] = data;
    return this.writeFile(this.streamerFile, streamers);
  }

  deleteStreamer(userId) {
    const streamers = this.readFile(this.streamerFile);
    delete streamers[userId];
    return this.writeFile(this.streamerFile, streamers);
  }

  // Ticket operations
  getTicket(ticketId) {
    const tickets = this.readFile(this.ticketFile);
    return tickets[ticketId] || null;
  }

  getAllTickets() {
    return this.readFile(this.ticketFile);
  }

  getTicketsByUser(userId) {
    const tickets = this.readFile(this.ticketFile);
    return Object.values(tickets).filter(ticket => ticket.userId === userId);
  }

  getTicketsByStatus(status) {
    const tickets = this.readFile(this.ticketFile);
    return Object.values(tickets).filter(ticket => ticket.status === status);
  }

  saveTicket(ticketId, data) {
    const tickets = this.readFile(this.ticketFile);
    tickets[ticketId] = data;
    return this.writeFile(this.ticketFile, tickets);
  }

  deleteTicket(ticketId) {
    const tickets = this.readFile(this.ticketFile);
    delete tickets[ticketId];
    return this.writeFile(this.ticketFile, tickets);
  }

  // Credit history operations
  addCreditHistory(entry) {
    const history = this.readFile(this.creditHistoryFile);
    history.push({
      ...entry,
      timestamp: new Date(),
    });
    return this.writeFile(this.creditHistoryFile, history);
  }

  getCreditHistory(userId) {
    const history = this.readFile(this.creditHistoryFile);
    return history.filter(entry => entry.userId === userId);
  }

  getAllCreditHistory() {
    return this.readFile(this.creditHistoryFile);
  }
}

module.exports = new Database();
