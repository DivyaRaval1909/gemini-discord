import { Client, GatewayIntentBits, ActivityType, Events } from 'discord.js';
import dotenv from 'dotenv';
import { askGemini } from './gemini.js';
import { registerCommands } from './deploy-commands.js';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

/**
 * Splits text into chunks smaller than maxChars while respecting line boundaries.
 * Discord enforces a 2000 character message limit.
 * @param {string} text
 * @param {number} maxChars
 * @returns {string[]}
 */
function splitDiscordMessage(text, maxChars = 1900) {
  if (text.length <= maxChars) {
    return [text];
  }

  const chunks = [];
  const lines = text.split('\n');
  let currentChunk = '';

  for (const line of lines) {
    if (currentChunk.length + line.length + 1 <= maxChars) {
      currentChunk += line + '\n';
    } else {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      // If a single unbroken line exceeds maxChars, chunk it by characters
      let tempLine = line;
      while (tempLine.length > maxChars) {
        chunks.push(tempLine.slice(0, maxChars));
        tempLine = tempLine.slice(maxChars);
      }
      currentChunk = tempLine + '\n';
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text.slice(0, maxChars)];
}

// Bot ready event
client.once(Events.ClientReady, async () => {
  console.log(`🚀 Bot is online! Logged in as ${client.user.tag} (ID: ${client.user.id})`);

  // Optionally auto-sync slash commands on startup if configured
  if (process.env.AUTO_DEPLOY_COMMANDS === 'true' && process.env.CLIENT_ID) {
    console.log('⚡ Auto-deploying slash commands on startup...');
    await registerCommands();
  }

  // Set bot activity status
  client.user.setActivity('/ask <question>', { type: ActivityType.Listening });
});

// Handle Slash Command Interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // 1. Ping Command
  if (commandName === 'ping') {
    const wsLatency = Math.round(client.ws.ping);
    return interaction.reply({
      content: `🏓 **Pong!** WebSocket Latency: \`${wsLatency}ms\``,
      ephemeral: true,
    });
  }

  // 2. Ask Gemini Command
  if (commandName === 'ask') {
    const question = interaction.options.getString('question', true);

    // CRITICAL: Defer the reply immediately (Discord requires an initial ACK within 3 seconds)
    await interaction.deferReply();

    console.log(`[Ask Command] ${interaction.user.tag} asked: "${question.slice(0, 80)}"`);

    try {
      // Call Google Gemini AI
      const answer = await askGemini(question);

      // Prepend question header
      const formattedResponse = `💬 **Q:** *${question}*\n\n${answer}`;

      // Chunk response if longer than Discord limit
      const chunks = splitDiscordMessage(formattedResponse);

      // Edit the deferred reply with the first chunk
      await interaction.editReply(chunks[0]);

      // Send any remaining chunks as followups
      for (let i = 1; i < chunks.length; i++) {
        await interaction.followUp(chunks[i]);
      }
    } catch (error) {
      console.error('Error handling /ask command:', error);
      await interaction.editReply({
        content: `⚠️ **Error querying Gemini AI:**\n\`${error.message || 'Unknown error occurred'}\``,
      });
    }
  }
});

// Validate Discord token
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('\n❌ Fatal: DISCORD_TOKEN is missing! Please configure your .env file.\n');
  process.exit(1);
}

// Log in to Discord Gateway
client.login(token);
