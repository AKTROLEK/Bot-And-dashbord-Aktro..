const { Events } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        
        const errorMessage = { 
          content: '❌ There was an error executing this command!', 
          ephemeral: true 
        };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }
    
    // Handle button interactions
    else if (interaction.isButton()) {
      // Button interaction handlers can be added here
      console.log(`Button pressed: ${interaction.customId}`);
    }
    
    // Handle select menu interactions
    else if (interaction.isStringSelectMenu()) {
      // Select menu handlers can be added here
      console.log(`Select menu used: ${interaction.customId}`);
    }
  },
};
