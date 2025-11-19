const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, ticketEmbed } = require('../utils/embeds');
const { canManageTickets } = require('../utils/permissions');
const database = require('../utils/database');
const Ticket = require('../models/Ticket');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket management commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new ticket')
        .addStringOption(option =>
          option.setName('type')
            .setDescription('Type of ticket')
            .setRequired(true)
            .addChoices(
              { name: 'Issue', value: 'issue' },
              { name: 'Credit Adjustment', value: 'credit' },
              { name: 'Promotion Request', value: 'promotion' },
              { name: 'Technical Support', value: 'support' }
            ))
        .addStringOption(option =>
          option.setName('description')
            .setDescription('Describe your issue')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('close')
        .setDescription('Close the current ticket')
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for closing')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all open tickets (Management only)'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('assign')
        .setDescription('Assign a ticket to a staff member (Management only)')
        .addUserOption(option =>
          option.setName('staff')
            .setDescription('Staff member to assign')
            .setRequired(true))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
      await this.createTicket(interaction);
    } else if (subcommand === 'close') {
      await this.closeTicket(interaction);
    } else if (subcommand === 'list') {
      await this.listTickets(interaction);
    } else if (subcommand === 'assign') {
      await this.assignTicket(interaction);
    }
  },

  async createTicket(interaction) {
    const type = interaction.options.getString('type');
    const description = interaction.options.getString('description');

    await interaction.deferReply({ ephemeral: true });

    try {
      // Check if user already has an open ticket of this type
      const existingTickets = database.getTicketsByUser(interaction.user.id);
      const openTicket = existingTickets.find(
        ticket => ticket.type === type && ticket.status === 'open'
      );

      if (openTicket) {
        return interaction.editReply({
          embeds: [errorEmbed('Ticket Already Exists', `You already have an open ${type} ticket. Please use that ticket or close it first.`)],
        });
      }

      // Create ticket channel
      const guild = interaction.guild;
      const ticketChannel = await guild.channels.create({
        name: `${type}-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: config.channels.ticketCategory,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
          ...config.roles.admin.map(roleId => ({
            id: roleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
          })),
          ...config.roles.streamerManager.map(roleId => ({
            id: roleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
          })),
        ],
      });

      // Create ticket object
      const ticket = new Ticket({
        type,
        userId: interaction.user.id,
        username: interaction.user.username,
        channelId: ticketChannel.id,
        metadata: { description },
      });

      ticket.addMessage(interaction.user.id, description);
      database.saveTicket(ticket.id, ticket);

      // Send message in ticket channel
      await ticketChannel.send({
        content: `${interaction.user} | ${config.roles.streamerManager.map(id => `<@&${id}>`).join(' ')}`,
        embeds: [ticketEmbed(ticket).addFields({ name: 'Description', value: description })],
      });

      await interaction.editReply({
        embeds: [successEmbed('Ticket Created', `Your ticket has been created! Check ${ticketChannel} for updates.`)],
      });

    } catch (error) {
      console.error('Error creating ticket:', error);
      await interaction.editReply({
        embeds: [errorEmbed('Error', 'Failed to create ticket. Please try again later.')],
      });
    }
  },

  async closeTicket(interaction) {
    await interaction.deferReply();

    try {
      const channelId = interaction.channel.id;
      const allTickets = database.getAllTickets();
      const ticket = Object.values(allTickets).find(t => t.channelId === channelId);

      if (!ticket) {
        return interaction.editReply({
          embeds: [errorEmbed('Not a Ticket', 'This command can only be used in ticket channels.')],
        });
      }

      // Check permissions
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (ticket.userId !== interaction.user.id && !canManageTickets(member)) {
        return interaction.editReply({
          embeds: [errorEmbed('Permission Denied', 'You do not have permission to close this ticket.')],
        });
      }

      const reason = interaction.options.getString('reason') || 'No reason provided';
      ticket.close(interaction.user.id, reason);
      database.saveTicket(ticket.id, ticket);

      await interaction.editReply({
        embeds: [successEmbed('Ticket Closed', `This ticket has been closed.\nReason: ${reason}\n\nThis channel will be deleted in 10 seconds.`)],
      });

      // Delete channel after delay
      setTimeout(async () => {
        try {
          await interaction.channel.delete();
          database.deleteTicket(ticket.id);
        } catch (error) {
          console.error('Error deleting ticket channel:', error);
        }
      }, 10000);

    } catch (error) {
      console.error('Error closing ticket:', error);
      await interaction.editReply({
        embeds: [errorEmbed('Error', 'Failed to close ticket. Please try again later.')],
      });
    }
  },

  async listTickets(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    
    if (!canManageTickets(member)) {
      return interaction.reply({
        embeds: [errorEmbed('Permission Denied', 'You do not have permission to view all tickets.')],
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const openTickets = database.getTicketsByStatus('open');
      
      if (openTickets.length === 0) {
        return interaction.editReply({
          embeds: [successEmbed('Open Tickets', 'There are no open tickets.')],
        });
      }

      const ticketList = openTickets.map(ticket => 
        `**${ticket.type}** - <#${ticket.channelId}> - ${ticket.username} - Created <t:${Math.floor(new Date(ticket.createdAt).getTime() / 1000)}:R>`
      ).join('\n');

      await interaction.editReply({
        embeds: [successEmbed('Open Tickets', ticketList)],
      });

    } catch (error) {
      console.error('Error listing tickets:', error);
      await interaction.editReply({
        embeds: [errorEmbed('Error', 'Failed to list tickets. Please try again later.')],
      });
    }
  },

  async assignTicket(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    
    if (!canManageTickets(member)) {
      return interaction.reply({
        embeds: [errorEmbed('Permission Denied', 'You do not have permission to assign tickets.')],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      const staff = interaction.options.getUser('staff');
      const channelId = interaction.channel.id;
      const allTickets = database.getAllTickets();
      const ticket = Object.values(allTickets).find(t => t.channelId === channelId);

      if (!ticket) {
        return interaction.editReply({
          embeds: [errorEmbed('Not a Ticket', 'This command can only be used in ticket channels.')],
        });
      }

      ticket.assignTo(staff.id);
      database.saveTicket(ticket.id, ticket);

      await interaction.editReply({
        embeds: [successEmbed('Ticket Assigned', `This ticket has been assigned to ${staff}.`)],
      });

    } catch (error) {
      console.error('Error assigning ticket:', error);
      await interaction.editReply({
        embeds: [errorEmbed('Error', 'Failed to assign ticket. Please try again later.')],
      });
    }
  },
};
