const config = require('../config');

/**
 * Check if user has admin role
 */
function isAdmin(member) {
  if (!member || !member.roles) return false;
  return config.roles.admin.some(roleId => member.roles.cache.has(roleId));
}

/**
 * Check if user has streamer manager role
 */
function isStreamerManager(member) {
  if (!member || !member.roles) return false;
  return config.roles.streamerManager.some(roleId => member.roles.cache.has(roleId));
}

/**
 * Check if user has management permissions (admin or streamer manager)
 */
function hasManagementPermission(member) {
  return isAdmin(member) || isStreamerManager(member);
}

/**
 * Check if user can manage tickets
 */
function canManageTickets(member) {
  return hasManagementPermission(member);
}

/**
 * Check if user can adjust credits
 */
function canAdjustCredits(member) {
  return hasManagementPermission(member);
}

/**
 * Check if user can view reports
 */
function canViewReports(member) {
  return hasManagementPermission(member);
}

module.exports = {
  isAdmin,
  isStreamerManager,
  hasManagementPermission,
  canManageTickets,
  canAdjustCredits,
  canViewReports,
};
