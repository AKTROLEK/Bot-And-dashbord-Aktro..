class Ticket {
  constructor(data = {}) {
    this.id = data.id || `ticket-${Date.now()}`;
    this.type = data.type; // application, issue, credit, promotion, support
    this.userId = data.userId;
    this.username = data.username;
    this.channelId = data.channelId;
    this.status = data.status || 'open'; // open, in-progress, closed
    this.priority = data.priority || 'normal'; // low, normal, high, urgent
    this.createdAt = data.createdAt || new Date();
    this.closedAt = data.closedAt || null;
    this.messages = data.messages || [];
    this.assignedTo = data.assignedTo || null;
    this.metadata = data.metadata || {}; // Additional data specific to ticket type
  }

  // Add message to ticket
  addMessage(userId, content) {
    this.messages.push({
      userId,
      content,
      timestamp: new Date(),
    });
  }

  // Close ticket
  close(closedBy, reason) {
    this.status = 'closed';
    this.closedAt = new Date();
    this.metadata.closedBy = closedBy;
    this.metadata.closeReason = reason;
  }

  // Assign ticket to staff
  assignTo(staffId) {
    this.assignedTo = staffId;
    this.status = 'in-progress';
  }

  // Update priority
  setPriority(priority) {
    this.priority = priority;
  }

  // Get ticket summary
  getSummary() {
    return {
      id: this.id,
      type: this.type,
      userId: this.userId,
      username: this.username,
      status: this.status,
      priority: this.priority,
      createdAt: this.createdAt,
      messageCount: this.messages.length,
      assignedTo: this.assignedTo,
    };
  }
}

module.exports = Ticket;
