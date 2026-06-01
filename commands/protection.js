import fs from 'fs';
import axios from 'axios';
import { loadTokens } from '../utils/secondaryTokens.js';

const whitelistPath = './whitelist.json';
const protectionPath = './protection_settings.json';
const gcConfigPath = './gc_config.json';

// Helper load/save functions
function loadJson(filePath, defaultValue) {
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {}
  }
  return defaultValue;
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
}

// Initial configs
let whitelist = loadJson(whitelistPath, { whitelist: [] });
let protectionSettings = loadJson(protectionPath, { punishment: 'ban', hard_banned: [], log_channel: null });
let gcConfig = loadJson(gcConfigPath, {
  enabled: true,
  whitelist: [],
  blacklist: [],
  silent: true,
  leave_message: "Goodbye.",
  remove_blacklisted: true,
  webhook_url: null,
  auto_block: false
});

// Setup globals on client
const commands = [];

// Detection State
let detectionEnabled = false;
let autoslowEnabled = false;
let slowmodeSeconds = 30;
let noinviteEnabled = false;

// 1. RAID DETECTION TOGGLE (.detection)
commands.push({
  name: 'detection',
  execute: async (message, args, client) => {
    const state = args[0]?.toLowerCase();
    if (state === 'on') {
      detectionEnabled = true;
    } else if (state === 'off') {
      detectionEnabled = false;
    } else {
      detectionEnabled = !detectionEnabled;
    }
    await message.channel.send(`\`\`\`Raid detection is now ${detectionEnabled ? 'enabled' : 'disabled'}.\`\`\``);
  }
});

// 2. PUNISHMENT CONFIG (.setpunishment)
commands.push({
  name: 'setpunishment',
  execute: async (message, args, client) => {
    const type = args[0]?.toLowerCase();
    const valid = ['ban', 'kick', 'timeout', 'strip', 'none'];
    if (!type || !valid.includes(type)) {
      return message.channel.send(`\`\`\`Invalid punishment. Choose from: ${valid.join(', ')}\`\`\``);
    }
    protectionSettings.punishment = type;
    saveJson(protectionPath, protectionSettings);
    await message.channel.send(`\`\`\`Punishment type set to: ${type}\`\`\``);
  }
});

// 3. WHITELIST COMMANDS (.swhitelist, .sunwhitelist)
commands.push({
  name: 'swhitelist',
  execute: async (message, args, client) => {
    const target = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.channel.send("```Please mention or specify a user ID.```");

    if (!whitelist.whitelist.includes(target.id)) {
      whitelist.whitelist.push(target.id);
      saveJson(whitelistPath, whitelist);
    }
    await message.channel.send(`\`\`\`${target.username} has been added to the whitelist.\`\`\``);
  }
});

commands.push({
  name: 'sunwhitelist',
  execute: async (message, args, client) => {
    const target = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.channel.send("```Please mention or specify a user ID.```");

    const idx = whitelist.whitelist.indexOf(target.id);
    if (idx !== -1) {
      whitelist.whitelist.splice(idx, 1);
      saveJson(whitelistPath, whitelist);
      await message.channel.send(`\`\`\`${target.username} has been removed from the whitelist.\`\`\``);
    } else {
      await message.channel.send(`\`\`\`${target.username} is not whitelisted.\`\`\``);
    }
  }
});

// 4. BAN COMMANDS (.softban, .hardban, .unhardban, .ghostban, .multiban, .banlist)
commands.push({
  name: 'softban',
  execute: async (message, args, client) => {
    if (!message.guild) return message.channel.send("```Server only.```");
    const target = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.channel.send("```Specify user.```");

    try {
      await message.guild.members.ban(target, { days: 7, reason: 'Softban' });
      await message.guild.members.unban(target, 'Softban complete');
      await message.channel.send(`\`\`\`Successfully softbanned ${target.username}\`\`\``);
    } catch (err) {
      await message.channel.send(`\`\`\`Error: ${err.message}\`\`\``);
    }
  }
});

commands.push({
  name: 'hardban',
  execute: async (message, args, client) => {
    if (!message.guild) return message.channel.send("```Server only.```");
    const target = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.channel.send("```Specify user.```");

    if (!protectionSettings.hard_banned.includes(target.id)) {
      protectionSettings.hard_banned.push(target.id);
      saveJson(protectionPath, protectionSettings);
    }

    try {
      await message.guild.members.ban(target, { reason: 'Hardban' });
      await message.channel.send(`\`\`\`Successfully hardbanned ${target.username}\`\`\``);
    } catch (err) {
      await message.channel.send(`\`\`\`Error: ${err.message}\`\`\``);
    }
  }
});

commands.push({
  name: 'unhardban',
  execute: async (message, args, client) => {
    const target = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.channel.send("```Specify user.```");

    const idx = protectionSettings.hard_banned.indexOf(target.id);
    if (idx !== -1) {
      protectionSettings.hard_banned.splice(idx, 1);
      saveJson(protectionPath, protectionSettings);
      await message.channel.send(`\`\`\`Removed ${target.username} from hardban list.\`\`\``);
    } else {
      await message.channel.send("```User is not hardbanned.```");
    }
  }
});

commands.push({
  name: 'ghostban',
  execute: async (message, args, client) => {
    if (!message.guild) return message.channel.send("```Server only.```");
    const userId = args[0]?.replace(/[<@!>]/g, '');
    if (!userId) return message.channel.send("```Specify a user ID.```");

    try {
      await message.guild.members.ban(userId, { reason: 'Ghostban' });
      await message.channel.send(`\`\`\`Successfully ghostbanned user ID: ${userId}\`\`\``);
    } catch (err) {
      await message.channel.send(`\`\`\`Error: ${err.message}\`\`\``);
    }
  }
});

commands.push({
  name: 'multiban',
  execute: async (message, args, client) => {
    if (!message.guild) return message.channel.send("```Server only.```");
    if (args.length === 0) return message.channel.send("```Specify user IDs to ban.```");

    const banned = [];
    const failed = [];

    for (const rawId of args) {
      const id = rawId.replace(/[<@!>]/g, '');
      try {
        await message.guild.members.ban(id, { reason: 'Mass ban' });
        banned.push(id);
      } catch {
        failed.push(id);
      }
    }

    await message.channel.send(`\`\`\`Mass ban complete.\nBanned: ${banned.join(', ') || 'None'}\nFailed: ${failed.join(', ') || 'None'}\`\`\``);
  }
});

commands.push({
  name: 'banlist',
  execute: async (message, args, client) => {
    if (!message.guild) return message.channel.send("```Server only.```");
    try {
      const bans = await message.guild.bans.fetch();
      if (bans.size === 0) return message.channel.send("```No banned users.```");
      const list = bans.map(b => `${b.user.tag} (${b.user.id}): ${b.reason || 'No reason'}`).join('\n');
      // Chunk to fit in discord limits
      const chunks = list.match(/[\s\S]{1,1900}/g) || [];
      for (const chunk of chunks) {
        await message.channel.send(`\`\`\`${chunk}\`\`\``);
      }
    } catch (err) {
      await message.channel.send(`\`\`\`Error fetching bans: ${err.message}\`\`\``);
    }
  }
});

// 5. STRIPALL command (remove admins)
commands.push({
  name: 'stripall',
  execute: async (message, args, client) => {
    if (!message.guild) return message.channel.send("```Server only.```");
    const statusMsg = await message.channel.send("```Scanning roles for admin permissions...```");
    
    try {
      const adminRoles = message.guild.roles.cache.filter(role => role.permissions.has('ADMINISTRATOR'));
      let removedCount = 0;

      for (const role of adminRoles.values()) {
        const members = role.members;
        for (const member of members.values()) {
          if (!whitelist.whitelist.includes(member.id) && member.id !== message.guild.ownerId) {
            try {
              await member.roles.remove(role);
              removedCount++;
            } catch {}
          }
        }
      }
      await statusMsg.edit(`\`\`\`Finished stripping admin permissions. Removed from ${removedCount} users.\`\`\``);
    } catch (err) {
      await statusMsg.edit(`\`\`\`Error during stripall: ${err.message}\`\`\``);
    }
  }
});

// 6. PROTECTION STATS command
commands.push({
  name: 'protectionstats',
  execute: async (message, args, client) => {
    await message.channel.send(`\`\`\`ansi
\x1b[35mShield Protection Stats:
\x1b[34mRaid Detection: \x1b[37m${detectionEnabled ? '✅ ON' : '❌ OFF'}
\x1b[34mPunishment:     \x1b[37m${protectionSettings.punishment}
\x1b[34mWhitelisted:    \x1b[37m${whitelist.whitelist.length} users
\x1b[34mHardbanned:     \x1b[37m${protectionSettings.hard_banned.length} users
\x1b[34mAnti-GC Spam:   \x1b[37m${gcConfig.enabled ? '✅ ON' : '❌ OFF'}
\`\`\``);
  }
});

// 7. ANTIGCSPAM CONFIG (.antigcspam)
commands.push({
  name: 'antigcspam',
  execute: async (message, args, client) => {
    const sub = args[0]?.toLowerCase();
    if (!sub) {
      gcConfig.enabled = !gcConfig.enabled;
      saveJson(gcConfigPath, gcConfig);
      return message.channel.send(`\`\`\`Anti GroupChat spam protection is now ${gcConfig.enabled ? 'enabled' : 'disabled'}.\`\`\``);
    }

    if (sub === 'whitelist') {
      const targetId = args[1]?.replace(/[<@!>]/g, '');
      if (!targetId) return message.channel.send("```Specify user ID to whitelist.```");
      if (!gcConfig.whitelist.includes(targetId)) {
        gcConfig.whitelist.push(targetId);
        saveJson(gcConfigPath, gcConfig);
      }
      await message.channel.send(`\`\`\`Added user ${targetId} to GC Whitelist.\`\`\``);
    }
    else if (sub === 'blacklist') {
      const targetId = args[1]?.replace(/[<@!>]/g, '');
      if (!targetId) return message.channel.send("```Specify user ID to blacklist.```");
      if (!gcConfig.blacklist.includes(targetId)) {
        gcConfig.blacklist.push(targetId);
        saveJson(gcConfigPath, gcConfig);
      }
      await message.channel.send(`\`\`\`Added user ${targetId} to GC Blacklist.\`\`\``);
    }
    else if (sub === 'silent') {
      const val = args[1]?.toLowerCase() === 'true';
      gcConfig.silent = val;
      saveJson(gcConfigPath, gcConfig);
      await message.channel.send(`\`\`\`GC leave silent mode set to ${val}.\`\`\``);
    }
    else if (sub === 'message') {
      const msg = args.slice(1).join(' ');
      gcConfig.leave_message = msg;
      saveJson(gcConfigPath, gcConfig);
      await message.channel.send(`\`\`\`GC leave message set to: "${msg}"\`\`\``);
    }
    else if (sub === 'list') {
      await message.channel.send(`\`\`\`GC Protection List:\nWhitelisted creators: ${gcConfig.whitelist.join(', ') || 'None'}\nBlacklisted creators: ${gcConfig.blacklist.join(', ') || 'None'}\`\`\``);
    }
  }
});

// Revert logic on audit log actions helper
async function punishRaidUser(user, guild, reason) {
  if (whitelist.whitelist.includes(user.id) || user.id === guild.ownerId) return;

  const punishment = protectionSettings.punishment;
  try {
    if (punishment === 'ban') {
      await guild.members.ban(user, { reason: `Protection: ${reason}` });
    } else if (punishment === 'kick') {
      const member = await guild.members.fetch(user.id);
      await member.kick(`Protection: ${reason}`);
    } else if (punishment === 'timeout') {
      const member = await guild.members.fetch(user.id);
      await member.timeout(3600 * 1000, `Protection: ${reason}`); // 1 hour timeout
    }
  } catch (err) {
    console.error(`Failed to punish user ${user.id} (${punishment}):`, err.message);
  }
}

// 8. LISTENERS FOR RAID PROTECTION & ANTI GC SPAM
export const events = {
  // Raid detection: Channel create
  channelCreate: async (channel, client) => {
    if (!detectionEnabled || !channel.guild) return;
    try {
      const audit = await channel.guild.fetchAuditLogs({ limit: 1, type: 'CHANNEL_CREATE' });
      const entry = audit.entries.first();
      if (entry && entry.executor) {
        const executor = entry.executor;
        if (!whitelist.whitelist.includes(executor.id)) {
          await channel.delete('Raid protection: unauthorized channel create');
          await punishRaidUser(executor, channel.guild, 'unauthorized channel creation');
        }
      }
    } catch {}
  },

  // Raid detection: Channel delete
  channelDelete: async (channel, client) => {
    if (!detectionEnabled || !channel.guild) return;
    try {
      const audit = await channel.guild.fetchAuditLogs({ limit: 1, type: 'CHANNEL_DELETE' });
      const entry = audit.entries.first();
      if (entry && entry.executor) {
        const executor = entry.executor;
        if (!whitelist.whitelist.includes(executor.id)) {
          // Re-create deleted channel
          await channel.clone({ reason: 'Raid protection: restore deleted channel' });
          await punishRaidUser(executor, channel.guild, 'unauthorized channel deletion');
        }
      }
    } catch {}
  },

  // Auto GC spam leave listener
  channelCreatePrivate: async (channel, client) => {
    // Note: discord.js-selfbot-v13 uses 'channelCreate' for group chats as well.
    // Group chats are type 'DM' or 'GROUP_DM'
    if (channel.type !== 'GROUP_DM') return;
    if (!gcConfig.enabled) return;

    // Retrieve first message or creator info
    setTimeout(async () => {
      try {
        const msgs = await channel.messages.fetch({ limit: 1 });
        const firstMsg = msgs.first();
        if (firstMsg) {
          const creator = firstMsg.author;
          
          if (gcConfig.whitelist.includes(creator.id)) {
            console.log(`GC created by whitelisted user: ${creator.tag}`);
            return;
          }

          if (gcConfig.blacklist.includes(creator.id)) {
            console.log(`GC created by blacklisted user: ${creator.tag}. Blocking...`);
            // Unfriend and Block
            await client.relationships.deleteFriend(creator.id).catch(() => {});
            await client.relationships.addBlock(creator.id).catch(() => {});
          }

          // Leave GC
          if (!gcConfig.silent) {
            await channel.send(gcConfig.leave_message).catch(() => {});
          }
          
          // Delete/Leave channel
          await channel.delete().catch(() => {});
          console.log(`Successfully left group chat ${channel.id}`);
        }
      } catch (err) {
        console.error("Error handling new group chat:", err.message);
      }
    }, 1000);
  },

  // Hook into channelCreate to delegate to channelCreatePrivate if type is GROUP_DM
  channelCreateDelegate: async (channel, client) => {
    if (channel.type === 'GROUP_DM') {
      await events.channelCreatePrivate(channel, client);
    } else {
      await events.channelCreate(channel, client);
    }
  }
};

// Bind delegate instead of normal channelCreate
events.channelCreate = events.channelCreateDelegate;

export default commands;
export { whitelist, protectionSettings, gcConfig };
