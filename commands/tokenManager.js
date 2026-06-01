import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { loadTokens, validateToken } from '../utils/secondaryTokens.js';
import { colors } from '../utils/consoleHelper.js';

const tokenFilePath = './token.txt';
const commands = [];

// 1. ADDTOKEN command
commands.push({
  name: 'addtoken',
  execute: async (message, args, client) => {
    const rawToken = args[0]?.trim();
    if (!rawToken) {
      return message.channel.send("```Command: .addtoken <token>```");
    }

    // Delete message to hide token if permissions allow
    try { await message.delete(); } catch {}

    const statusMsg = await message.channel.send("```ansi\n\x1b[335mValidating token...\\x1b[0m```");
    const result = await validateToken(rawToken);

    if (result.valid) {
      const tokens = loadTokens();
      if (tokens.includes(rawToken)) {
        return statusMsg.edit("```ansi\n\x1b[335mToken already exists in token.txt\x1b[0m```");
      }
      tokens.push(rawToken);
      fs.writeFileSync(tokenFilePath, tokens.join('\n') + '\n');
      await statusMsg.edit(`\`\`\`ansi\n\x1b[335mToken added successfully! User: ${result.username}\x1b[0m\`\`\``);
    } else {
      await statusMsg.edit(`\`\`\`ansi\n\x1b[335mInvalid token! Error: ${result.error}\x1b[0m\`\`\``);
    }
  }
});

// 2. REMOVETOKEN command
commands.push({
  name: 'removetoken',
  execute: async (message, args, client) => {
    const rawToken = args[0]?.trim();
    if (!rawToken) return message.channel.send("```Command: .removetoken <token>```");

    try { await message.delete(); } catch {}

    const tokens = loadTokens();
    const idx = tokens.indexOf(rawToken);

    if (idx !== -1) {
      tokens.splice(idx, 1);
      fs.writeFileSync(tokenFilePath, tokens.join('\n') + (tokens.length > 0 ? '\n' : ''));
      await message.channel.send("```ansi\n\x1b[335mToken removed successfully!\x1b[0m```");
    } else {
      await message.channel.send("```ansi\n\x1b[335mToken not found in token.txt!\x1b[0m```");
    }
  }
});

// 3. LISTTOKENS command
commands.push({
  name: 'listtokens',
  aliases: ['tok'],
  execute: async (message, args, client) => {
    try { await message.delete(); } catch {}

    const tokens = loadTokens();
    if (tokens.length === 0) {
      return message.channel.send("```ansi\n\x1b[335mNo tokens found in token.txt!\x1b[0m```");
    }

    const listText = tokens.map((t, i) => `${i + 1}. ${t.slice(0, 20)}...${t.slice(-6)}`).join('\n');
    await message.channel.send(`\`\`\`ansi\n\x1b[335mCurrent tokens:\n${listText}\x1b[0m\`\`\``);
  }
});

commands.push({
  name: 'token',
  execute: async (message, args, client) => {
    const sub = args[0]?.toLowerCase();
    const targetName = {
      add: 'addtoken',
      remove: 'removetoken',
      list: 'listtokens',
      clear: 'cleartoken'
    }[sub];

    if (!targetName) {
      return message.channel.send("```Command: .token add/remove/list/clear```");
    }

    const target = commands.find(command => command.name === targetName);
    return target.execute(message, args.slice(1), client);
  }
});

// 4. CLEARTOKEN command
commands.push({
  name: 'cleartoken',
  execute: async (message, args, client) => {
    try { await message.delete(); } catch {}

    fs.writeFileSync(tokenFilePath, '');
    await message.channel.send("```ansi\n\x1b[335mAll tokens have been cleared!\x1b[0m```");
  }
});

// 5. TJOIN command (Invite tokens to guild)
commands.push({
  name: 'tjoin',
  execute: async (message, args, client) => {
    const inviteLink = args[0];
    const rawCount = parseInt(args[1]);

    if (!inviteLink || isNaN(rawCount) || rawCount <= 0) {
      return message.channel.send("```Command: .tjoin <invite_link> <token_count>```");
    }

    const inviteCode = inviteLink.split('/').pop();
    const tokens = loadTokens().slice(0, rawCount);

    if (tokens.length === 0) {
      return message.channel.send("```No tokens found in token.txt!```");
    }

    const statusMsg = await message.channel.send("```Starting join process...```");
    let joined = 0;
    let failed = 0;

    for (const token of tokens) {
      try {
        const response = await axios.post(
          `https://discord.com/api/v9/invites/${inviteCode}`,
          {
            session_id: Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
          },
          {
            headers: {
              'Authorization': token.trim(),
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          }
        );
        if (response.status === 200 || response.status === 201) {
          joined++;
        } else {
          failed++;
        }
      } catch (err) {
        failed++;
      }
      await statusMsg.edit(`\`\`\`Joining progress:\nSuccessful: ${joined}\nFailed: ${failed}\`\`\``);
      // Small sleep to prevent rate limiting
      await new Promise(r => setTimeout(r, 500));
    }
    await statusMsg.edit(`\`\`\`Join process completed:\nSuccessful joins: ${joined}\nFailed joins: ${failed}\`\`\``);
  }
});

export default commands;
