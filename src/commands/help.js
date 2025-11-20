const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { t } = require('../utils/localization');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands and information'),

  async execute(interaction) {
    const helpEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(t('HELP_TITLE'))
      .setDescription(t('HELP_DESCRIPTION'))
      .addFields(
        {
          name: t('HELP_STREAMER_COMMANDS'),
          value: t('HELP_STREAMER_COMMANDS_DESC'),
          inline: false,
        },
        {
          name: t('HELP_TICKET_COMMANDS'),
          value: t('HELP_TICKET_COMMANDS_DESC'),
          inline: false,
        },
        {
          name: t('HELP_MANAGEMENT_COMMANDS'),
          value: t('HELP_MANAGEMENT_COMMANDS_DESC'),
          inline: false,
        },
        {
          name: t('HELP_CREDIT_SYSTEM'),
          value: t('HELP_CREDIT_SYSTEM_DESC'),
          inline: false,
        },
        {
          name: t('HELP_SUPPORTED_PLATFORMS'),
          value: t('HELP_SUPPORTED_PLATFORMS_DESC'),
          inline: false,
        },
        {
          name: t('HELP_FEATURES'),
          value: t('HELP_FEATURES_DESC'),
          inline: false,
        }
      )
      .setFooter({ text: t('HELP_FOOTER') })
      .setTimestamp();

    await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
  },
};
