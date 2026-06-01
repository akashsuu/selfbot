import { Client } from 'discord.js-selfbot-v13';
import { loadTokens } from '../utils/secondaryTokens.js';

const commands = [];
const activeVoiceClients = [];

function isVoiceChannel(channel) {
  return Boolean(channel && (typeof channel.join === 'function' || channel.type === 'GUILD_VOICE' || channel.type === 2));
}

// Helper to spawn a client and connect to voice
async function spawnVoiceClient(token, channelId, guildId) {
  try {
    const vcClient = new Client({ checkUpdate: false });
    
    vcClient.once('ready', async () => {
      try {
        const guild = vcClient.guilds.cache.get(guildId);
        const channel = guild?.channels.cache.get(channelId);
        if (isVoiceChannel(channel)) {
          // discord.js-selfbot-v13 voice join connection method
          await channel.join().catch(() => {});
          activeVoiceClients.push(vcClient);
          console.log(`Connected voice token ending in: ${token.slice(-4)}`);
        } else {
          await vcClient.destroy();
        }
      } catch (err) {
        console.error(`Error in voice connect: ${err.message}`);
        await vcClient.destroy();
      }
    });

    await vcClient.login(token);
  } catch (err) {
    console.error(`Failed to login voice client: ${err.message}`);
  }
}

// 1. VCMULTI command (joins secondary tokens into voice channel)
commands.push({
  name: 'vcmulti',
  aliases: ['multivc'],
  execute: async (message, args, client) => {
    const channelId = args[0];
    if (!channelId) {
      return message.channel.send("```Command: .vcmulti <channel_id>```");
    }

    const channel = client.channels.cache.get(channelId);
    if (!isVoiceChannel(channel)) {
      return message.channel.send("```Invalid voice channel ID.```");
    }

    const tokens = loadTokens();
    if (tokens.length === 0) {
      return message.channel.send("```No tokens found in token.txt!```");
    }

    await message.channel.send(`\`\`\`Attempting to connect ${tokens.length} tokens to VC... \`\`\``);
    
    for (const token of tokens) {
      // Don't log in the main client token again
      if (token.trim() === client.token) continue;
      await spawnVoiceClient(token.trim(), channelId, channel.guild.id);
      await new Promise(r => setTimeout(r, 1000)); // Rate limit buffer
    }
  }
});

// 2. VCEND command (disconnects all secondary voice tokens)
commands.push({
  name: 'vcend',
  execute: async (message, args, client) => {
    if (activeVoiceClients.length === 0) {
      return message.channel.send("```No active voice clients running.```");
    }

    await message.channel.send(`\`\`\`Disconnecting ${activeVoiceClients.length} voice clients...\`\`\``);
    
    while (activeVoiceClients.length > 0) {
      const vcClient = activeVoiceClients.pop();
      try {
        await vcClient.destroy();
      } catch {}
    }

    await message.channel.send("```Successfully disconnected all voice clients.```");
  }
});

// 3. VCJOIN command (main client voice actions)
commands.push({
  name: 'vcjoin',
  execute: async (message, args, client) => {
    const sub = args[0]?.toLowerCase();
    
    if (sub === 'stable' || sub === 's') {
      const channelId = args[1];
      if (!channelId) return message.channel.send("```Command: .vcjoin stable <channel_id>```");

      const channel = client.channels.cache.get(channelId);
      if (!isVoiceChannel(channel)) {
        return message.channel.send("```Invalid voice channel ID.```");
      }

      try {
        await channel.join();
        await message.channel.send(`\`\`\`Joined voice channel: ${channel.name}\`\`\``);
      } catch (err) {
        await message.channel.send(`\`\`\`Failed to join: ${err.message}\`\`\``);
      }
    }
    else if (sub === 'leave' || sub === 'l') {
      const voiceChannel = message.guild?.me?.voice?.channel;
      if (voiceChannel) {
        if (typeof voiceChannel.leave === 'function') {
          voiceChannel.leave();
        } else if (message.guild.me.voice?.disconnect) {
          message.guild.me.voice.disconnect();
        }
        await message.channel.send("```Left voice channel.```");
      } else {
        await message.channel.send("```Not currently in a voice channel.```");
      }
    }
    else {
      await message.channel.send(`\`\`\`ansi
Voice Channel Commands:
    • .vcjoin stable <channel_id> - Join and stay in one voice channel
    • .vcjoin leave               - Leave voice channel
\`\`\``);
    }
  }
});

export default commands;
export { activeVoiceClients };
