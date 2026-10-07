import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

export const commandDefinitions = [
  new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask Google Gemini AI any question')
    .addStringOption((option) =>
      option
        .setName('question')
        .setDescription('The question or prompt to ask Gemini')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot status and WebSocket latency'),
].map((cmd) => cmd.toJSON());

/**
 * Registers slash commands with Discord API.
 */
export async function registerCommands() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID; // Optional: provides instant command sync in a specific server

  if (!token || !clientId) {
    console.warn('⚠️  [deploy-commands] DISCORD_TOKEN or CLIENT_ID is missing in .env. Skipping slash command registration.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('🔄 Registering slash commands with Discord...');

    if (guildId) {
      // Guild commands update immediately in the specified server (ideal for dev/testing)
      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commandDefinitions }
      );
      console.log(`✅ Successfully registered ${data.length} slash command(s) to Guild (${guildId})!`);
    } else {
      // Global commands register across all servers the bot is in
      const data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commandDefinitions }
      );
      console.log(`✅ Successfully registered ${data.length} global slash command(s)!`);
    }
  } catch (error) {
    console.error('❌ Failed to register slash commands:', error);
  }
}

// Allow direct execution: `node src/deploy-commands.js`
if (process.argv[1] && process.argv[1].endsWith('deploy-commands.js')) {
  registerCommands();
}
