import { exec } from 'child_process';
import open from 'open';
import fs from 'fs';
import path from 'path';
import os from 'os';
import axios from 'axios';
import { loadTokens, sendTokenMessage } from '../utils/secondaryTokens.js';
import { colors } from '../utils/consoleHelper.js';

const commands = [];

// 1. SAY command
commands.push({
  name: 'say',
  execute: async (message, args, client) => {
    if (args.length === 0) {
      return message.channel.send("```Usage: .say <message> OR .say <token_index> <message>```");
    }

    const tokens = loadTokens();
    const possibleIndex = parseInt(args[0]);

    if (!isNaN(possibleIndex) && possibleIndex > 0) {
      // Use specific token
      if (possibleIndex > tokens.length) {
        return message.channel.send("```Invalid token index!```");
      }
      if (args.length < 2) {
        return message.channel.send("```Please specify a message to send!```");
      }
      const token = tokens[possibleIndex - 1];
      const content = args.slice(1).join(' ');
      
      const success = await sendTokenMessage(token, message.channel.id, content);
      if (success) {
        try { await message.delete(); } catch {}
      } else {
        await message.channel.send("```Failed to send message with secondary token.```");
      }
    } else {
      // Send with ALL tokens (including self client)
      const content = args.join(' ');
      // Main client sends it
      await message.edit(content).catch(() => {});
      
      // Secondary tokens send in parallel
      for (const token of tokens) {
        sendTokenMessage(token, message.channel.id, content);
      }
    }
  }
});

// 2. MIMIC commands
commands.push({
  name: 'mimic',
  execute: async (message, args, client) => {
    const targetUser = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) {
      return message.channel.send("```Please mention or specify a user ID to mimic.```");
    }
    client.mimicUser = targetUser.id;
    await message.channel.send(`\`\`\`Now mimicking ${targetUser.username}'s messages.\`\`\``);
  }
});

commands.push({
  name: 'mimicoff',
  execute: async (message, args, client) => {
    client.mimicUser = null;
    await message.channel.send("```Stopped mimicking messages.```");
  }
});

// 3. NICKNAME command
commands.push({
  name: 'nickname',
  execute: async (message, args, client) => {
    if (!message.guild) {
      return message.channel.send("```This command can only be used in a server.```");
    }
    const newNick = args.join(' ');
    try {
      await message.guild.me.setNickname(newNick);
      await message.channel.send(`\`\`\`Nickname changed to: ${newNick || 'Default'}\`\`\``);
    } catch (err) {
      await message.channel.send(`\`\`\`Failed to change nickname: ${err.message}\`\`\``);
    }
  }
});

// 4. WINDOWS UTILITY commands (Calculators, Notepad, Browser searches)
commands.push({
  name: 'opencalc',
  execute: async (message, args, client) => {
    if (process.platform !== 'win32') {
      return message.channel.send("```Calculator is only available on Windows.```");
    }
    exec('calc', (err) => {
      if (err) message.channel.send(`\`\`\`Error: ${err.message}\`\`\``);
    });
    await message.channel.send("```ansi\n\x1b[335mOpened Windows Calculator.\x1b[0m```");
  }
});

commands.push({
  name: 'openpad',
  execute: async (message, args, client) => {
    if (process.platform !== 'win32') {
      return message.channel.send("```Notepad is only available on Windows.```");
    }
    exec('notepad', (err) => {
      if (err) message.channel.send(`\`\`\`Error: ${err.message}\`\`\``);
    });
    await message.channel.send("```ansi\n\x1b[335mOpened Windows Notepad.\x1b[0m```");
  }
});

commands.push({
  name: 'bsearch',
  execute: async (message, args, client) => {
    const query = args.join(' ');
    if (!query) return message.channel.send("```Specify a query to search.```");
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    await open(url);
    await message.channel.send(`\`\`\`ansi\n\x1b[335mSearching for ${query} using your default browser.\x1b[0m\`\`\``);
  }
});

commands.push({
  name: 'dfolder',
  execute: async (message, args, client) => {
    const name = args.join(' ');
    if (!name) return message.channel.send("```Please specify a folder name.```");
    
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const folderPath = path.join(desktopPath, name);
    
    if (fs.existsSync(folderPath)) {
      await message.channel.send(`\`\`\`ansi\n\x1b[335mThe folder \x1b[335m${name}\x1b[335m already exists.\x1b[0m\`\`\``);
    } else {
      try {
        fs.mkdirSync(folderPath);
        await message.channel.send(`\`\`\`ansi\n\x1b[335mFolder ${name} has been created on your Desktop.\x1b[0m\`\`\``);
      } catch (err) {
        await message.channel.send(`\`\`\`Error creating folder: ${err.message}\`\`\``);
      }
    }
  }
});

commands.push({
  name: 'cleartemp',
  execute: async (message, args, client) => {
    const tempDir = os.tmpdir();
    const msg = await message.channel.send("```Clearing temp folder...```");
    
    try {
      const files = fs.readdirSync(tempDir);
      let deleted = 0;
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        try {
          const stats = fs.statSync(filePath);
          if (stats.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
          deleted++;
        } catch {}
      }
      await msg.edit(`\`\`\`ansi\n\x1b[335mCleared ${deleted}/${files.length} items from Temp folder successfully!\x1b[0m\`\`\``);
    } catch (err) {
      await msg.edit(`\`\`\`Error clearing temp folder: ${err.message}\`\`\``);
    }
  }
});

// 5. SOCIAL MEDIA SEARCHES
const socialMedia = {
  byoutube: 'https://www.youtube.com/results?search_query=',
  btiktok: 'https://www.tiktok.com/search?q=',
  btwitter: 'https://twitter.com/search?q=',
  broblox: 'https://www.roblox.com/search/users/?keyword='
};

for (const [cmd, baseUrl] of Object.entries(socialMedia)) {
  commands.push({
    name: cmd,
    execute: async (message, args, client) => {
      const search = args.join(' ');
      if (!search) return message.channel.send("```Please specify a search query.```");
      const url = `${baseUrl}${encodeURIComponent(search)}`;
      await open(url);
      await message.channel.send(`\`\`\`ansi\n\x1b[335m${cmd.slice(1).toUpperCase()} search for \x1b[335m${search}\x1b[335m has been opened.\x1b[0m\`\`\``);
    }
  });
}

// 6. ROBLOX user details fetch command
commands.push({
  name: 'roblox',
  execute: async (message, args, client) => {
    const username = args[0];
    if (!username) return message.channel.send("```Usage: .roblox <username>```");
    
    try {
      // Fetch user ID from username
      const userResp = await axios.post('https://users.roblox.com/v1/usernames/users', {
        usernames: [username],
        excludeBannedUsers: false
      });
      
      if (!userResp.data.data || userResp.data.data.length === 0) {
        return message.channel.send("```Roblox user not found.```");
      }
      
      const userId = userResp.data.data[0].id;
      const displayName = userResp.data.data[0].displayName;
      
      // Fetch detailed profile info
      const detailResp = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
      const createdDate = new Date(detailResp.data.created).toLocaleDateString();
      const bio = detailResp.data.description || 'No description';
      
      await message.channel.send(`\`\`\`ansi
\x1b[35mRoblox User Info:
\x1b[335mUsername:     \x1b[37m${username}
\x1b[335mDisplay Name: \x1b[37m${displayName}
\x1b[335mUser ID:      \x1b[37m${userId}
\x1b[335mCreated Date: \x1b[37m${createdDate}
\x1b[335mAbout Me:     \x1b[37m${bio.slice(0, 150)}
\`\`\``);
    } catch (err) {
      await message.channel.send(`\`\`\`Error fetching Roblox user: ${err.message}\`\`\``);
    }
  }
});

// Event listener for mimicking messages
export const events = {
  messageCreate: async (message, client) => {
    if (client.mimicUser && message.author.id === client.mimicUser) {
      if (message.content) {
        await message.channel.send(message.content).catch(() => {});
      }
    }
  }
};

export default commands;
