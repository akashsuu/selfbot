import fs from 'fs';
import { loadTokens, sendTokenMessage } from '../utils/secondaryTokens.js';
import { colors } from '../utils/consoleHelper.js';

const ladderConfigPath = './ladder_messages.json';
const defaultLadderMessages = [
  "I am higher than you",
  "I am above you",
  "You're beneath me",
  "Bow down peasant",
  "Keep climbing",
  "Stay down there",
  "Looking down on you",
  "Higher than you'll ever be",
  "Keep trying to reach me"
];

// Helper to load/save ladder messages
function loadLadderMessages() {
  if (fs.existsSync(ladderConfigPath)) {
    try {
      return JSON.parse(fs.readFileSync(ladderConfigPath, 'utf-8'));
    } catch {}
  }
  return [...defaultLadderMessages];
}

function saveLadderMessages(msgs) {
  fs.writeFileSync(ladderConfigPath, JSON.stringify(msgs, null, 4));
}

// Global active loop trackers on client
const activeLoops = {
  spam: null,
  invis: null,
  outlast: null,
  multilast: null,
  mping: null,
  laz: null,
  repeat: null,
  ladder: null
};

// Default lists to prevent empty array issues
const defaultOutlastMessages = [
  "is outlasting you!",
  "can't keep up with me.",
  "clown down.",
  "get better soon.",
  "you are so slow.",
  "stay down.",
  "climbing is not for you.",
  "is that all you got?",
  "ez outlast.",
  "clown of the day goes to you."
];

const defaultKillMessages = [
  "get killed skid",
  "ratio clown",
  "absolute L",
  "no help for you",
  "stay offline",
  "clown energy"
];

const commands = [];

// 1. SPAM commands
commands.push({
  name: 'spam',
  execute: async (message, args, client) => {
    const content = args.join(' ');
    if (!content) return message.channel.send("```Please specify a message to spam.```");

    if (activeLoops.spam) {
      clearInterval(activeLoops.spam);
    }

    await message.channel.send(`\`\`\`Starting spam of '${content}'. Use .spamoff to stop.\`\`\``);
    activeLoops.spam = setInterval(() => {
      message.channel.send(content).catch(() => {});
    }, 100); // 100ms interval
  }
});

commands.push({
  name: 'spamoff',
  execute: async (message, args, client) => {
    if (activeLoops.spam) {
      clearInterval(activeLoops.spam);
      activeLoops.spam = null;
      await message.channel.send("```Stopped spamming.```");
    } else {
      await message.channel.send("```Not currently spamming.```");
    }
  }
});

// 2. INVIS commands
commands.push({
  name: 'invis',
  execute: async (message, args, client) => {
    if (activeLoops.invis) {
      return message.channel.send("```Already spamming invis.```");
    }

    const invisText = "** ** \n".repeat(20) + "\nakashsuu sb owns u";
    await message.channel.send("```Started spamming invis.```");
    activeLoops.invis = setInterval(() => {
      message.channel.send(invisText).catch(() => {});
    }, 1000);
  }
});

commands.push({
  name: 'invisoff',
  execute: async (message, args, client) => {
    if (activeLoops.invis) {
      clearInterval(activeLoops.invis);
      activeLoops.invis = null;
      await message.channel.send("```Stopped invis spamming.```");
    } else {
      await message.channel.send("```Not currently spamming.```");
    }
  }
});

// 3. OUTLAST command
commands.push({
  name: 'outlast',
  execute: async (message, args, client) => {
    const targetUser = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) {
      return message.channel.send("```Please mention or specify a user ID to outlast.```");
    }

    if (activeLoops.outlast) {
      return message.channel.send("```An outlast session is already running.```");
    }

    let counter = 1;
    await message.channel.send(`\`\`\`Started outlast on ${targetUser.username}\`\`\``);

    activeLoops.outlast = setInterval(async () => {
      const msgText = defaultOutlastMessages[Math.floor(Math.random() * defaultOutlastMessages.length)];
      try {
        await message.channel.send(`${targetUser.toString()} ${msgText}\n\`\`\`${counter}\`\`\``);
        counter++;
      } catch (err) {
        console.error("Error in outlast loop:", err.message);
      }
    }, 800);
  }
});

commands.push({
  name: 'stopoutlast',
  execute: async (message, args, client) => {
    if (activeLoops.outlast) {
      clearInterval(activeLoops.outlast);
      activeLoops.outlast = null;
      await message.channel.send("```The outlast session has been stopped.```");
    } else {
      await message.channel.send("```No outlast session is currently running.```");
    }
  }
});

// 4. MULTILAST (Multi-token assisted outlast)
commands.push({
  name: 'multilast',
  execute: async (message, args, client) => {
    const targetUser = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) {
      return message.channel.send("```Please mention or specify a user ID to multilast.```");
    }

    if (activeLoops.multilast) {
      return message.channel.send("```A multilast session is already running.```");
    }

    const tokens = loadTokens();
    if (tokens.length === 0) {
      return message.channel.send("```No tokens found in token.txt!```");
    }

    let counter = 1;
    let tokenIndex = 0;
    await message.channel.send(`\`\`\`Started multilast on ${targetUser.username} with ${tokens.length} tokens.\`\`\``);

    activeLoops.multilast = setInterval(async () => {
      const msgText = defaultOutlastMessages[Math.floor(Math.random() * defaultOutlastMessages.length)];
      const currentToken = tokens[tokenIndex];
      tokenIndex = (tokenIndex + 1) % tokens.length;

      const content = `${targetUser.toString()} ${msgText}\n\`\`\`${counter}\`\`\``;
      sendTokenMessage(currentToken, message.channel.id, content);
      counter++;
    }, 300); // Fast interval since it utilizes multiple tokens
  }
});

commands.push({
  name: 'stopmultilast',
  execute: async (message, args, client) => {
    if (activeLoops.multilast) {
      clearInterval(activeLoops.multilast);
      activeLoops.multilast = null;
      await message.channel.send("```The multilast session has been stopped.```");
    } else {
      await message.channel.send("```No multilast session is currently running.```");
    }
  }
});

// 5. MPING (Mass ping server using secondary tokens)
commands.push({
  name: 'mping',
  execute: async (message, args, client) => {
    if (activeLoops.mping) {
      return message.channel.send("```Mass ping is already running.```");
    }

    const tokens = loadTokens();
    if (tokens.length === 0) {
      return message.channel.send("```No tokens found in token.txt!```");
    }

    const roles = message.guild ? message.guild.roles.cache.map(r => r.toString()) : [];
    const members = message.guild ? message.guild.members.cache.map(m => m.toString()) : [];
    const pings = [...roles, ...members, "@everyone"].filter(p => p);

    if (pings.length === 0) {
      return message.channel.send("```No targets to ping.```");
    }

    await message.channel.send("```Starting mass ping...```");

    let tokenIndex = 0;
    activeLoops.mping = setInterval(() => {
      const chunk = [];
      for (let i = 0; i < 5; i++) {
        const p = pings[Math.floor(Math.random() * pings.length)];
        if (p) chunk.push(p);
      }
      const pingText = chunk.join(' ');
      const currentToken = tokens[tokenIndex];
      tokenIndex = (tokenIndex + 1) % tokens.length;

      sendTokenMessage(currentToken, message.channel.id, pingText);
    }, 400);
  }
});

commands.push({
  name: 'mpingoff',
  execute: async (message, args, client) => {
    if (activeLoops.mping) {
      clearInterval(activeLoops.mping);
      activeLoops.mping = null;
      await message.channel.send("```Mass ping stopped.```");
    } else {
      await message.channel.send("```Mass ping is not running.```");
    }
  }
});

// 6. REPEAT message commands
commands.push({
  name: 'repeat',
  execute: async (message, args, client) => {
    const sub = args[0]?.toLowerCase();
    if (sub === 'start') {
      const content = args.slice(1).join(' ');
      if (!content) return message.channel.send("```Command: .repeat start <message>```");
      
      if (activeLoops.repeat) clearInterval(activeLoops.repeat);
      
      await message.channel.send(`\`\`\`Repeat started for: ${content}\`\`\``);
      activeLoops.repeat = setInterval(() => {
        message.channel.send(content).catch(() => {});
      }, client.repeatDelay || 2000);
    } 
    else if (sub === 'stop') {
      if (activeLoops.repeat) {
        clearInterval(activeLoops.repeat);
        activeLoops.repeat = null;
        await message.channel.send("```Repeat stopped.```");
      } else {
        await message.channel.send("```Repeat is not running.```");
      }
    }
    else if (sub === 'delay') {
      const delayVal = parseFloat(args[1]);
      if (isNaN(delayVal) || delayVal <= 0) {
        return message.channel.send("```Invalid delay. Enter a positive number.```");
      }
      client.repeatDelay = delayVal * 1000;
      await message.channel.send(`\`\`\`Repeat delay set to ${delayVal} seconds.\`\`\``);
    }
    else {
      const status = activeLoops.repeat ? 'ON' : 'OFF';
      await message.channel.send(`\`\`\`Repeat status: ${status} (Delay: ${(client.repeatDelay || 2000) / 1000}s)\`\`\``);
    }
  }
});

// 7. LADDER commands
commands.push({
  name: 'ladder',
  execute: async (message, args, client) => {
    const sub = args[0]?.toLowerCase();
    const msgs = loadLadderMessages();

    if (sub === 'start') {
      if (activeLoops.ladder) clearInterval(activeLoops.ladder);
      if (msgs.length === 0) return message.channel.send("```No ladder messages set.```");

      await message.channel.send("```Ladder started.```");
      let idx = 0;
      activeLoops.ladder = setInterval(() => {
        const text = msgs[idx];
        idx = (idx + 1) % msgs.length;
        message.channel.send(text).catch(() => {});
      }, client.ladderDelay || 1500);
    }
    else if (sub === 'stop') {
      if (activeLoops.ladder) {
        clearInterval(activeLoops.ladder);
        activeLoops.ladder = null;
        await message.channel.send("```Ladder stopped.```");
      } else {
        await message.channel.send("```Ladder is not running.```");
      }
    }
    else if (sub === 'add') {
      const msgText = args.slice(1).join(' ');
      if (!msgText) return message.channel.send("```Specify message to add.```");
      msgs.push(msgText);
      saveLadderMessages(msgs);
      await message.channel.send(`\`\`\`Added ladder message: ${msgText}\`\`\``);
    }
    else if (sub === 'remove') {
      const msgText = args.slice(1).join(' ');
      const idx = msgs.indexOf(msgText);
      if (idx !== -1) {
        msgs.splice(idx, 1);
        saveLadderMessages(msgs);
        await message.channel.send(`\`\`\`Removed ladder message.\`\`\``);
      } else {
        await message.channel.send("```Ladder message not found.```");
      }
    }
    else if (sub === 'clear') {
      saveLadderMessages([]);
      await message.channel.send("```Cleared all ladder messages.```");
    }
    else if (sub === 'list' || sub === 'status') {
      const listText = msgs.map((m, i) => `${i+1}. ${m}`).join('\n') || 'No ladder messages set.';
      await message.channel.send(`\`\`\`Current ladder list:\n${listText}\`\`\``);
    }
    else if (sub === 'delay') {
      const val = parseFloat(args[1]);
      if (isNaN(val) || val <= 0) return message.channel.send("```Invalid delay value.```");
      client.ladderDelay = val * 1000;
      await message.channel.send(`\`\`\`Ladder delay set to ${val} seconds.\`\`\``);
    }
    else if (sub === 'reset') {
      saveLadderMessages([...defaultLadderMessages]);
      await message.channel.send("```Reset ladder messages to default values.```");
    }
    else {
      await message.channel.send("```Command: .ladder <start/stop/add/remove/clear/list/delay/reset>```");
    }
  }
});

// 8. LAZ command (targeted spam loops)
commands.push({
  name: 'laz',
  execute: async (message, args, client) => {
    const targetUser = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) return message.channel.send("```Mention a user to target.```");

    if (activeLoops.laz) clearInterval(activeLoops.laz);

    const words = ["clown", "ez", "ratio", "L", "slow", "bot", "skid"];
    await message.channel.send(`\`\`\`Laz started on ${targetUser.username}.\`\`\``);
    
    activeLoops.laz = setInterval(() => {
      const w = words[Math.floor(Math.random() * words.length)];
      message.channel.send(`${targetUser.toString()} ${w}`).catch(() => {});
    }, 1000);
  }
});

commands.push({
  name: 'endlaz',
  execute: async (message, args, client) => {
    if (activeLoops.laz) {
      clearInterval(activeLoops.laz);
      activeLoops.laz = null;
      await message.channel.send("```Laz stopped.```");
    } else {
      await message.channel.send("```Laz is not running.```");
    }
  }
});

// 9. HYPESQUAD command
commands.push({
  name: 'hypesquad',
  execute: async (message, args, client) => {
    const choice = args[0]?.toLowerCase();
    
    const houses = {
      bravery: 'HOUSE_BRAVERY',
      brilliance: 'HOUSE_BRILLIANCE',
      balance: 'HOUSE_BALANCE',
      off: null
    };

    if (!choice || !Object.keys(houses).includes(choice)) {
      return message.channel.send("```Command: .hypesquad <bravery/brilliance/balance/off>```");
    }

    try {
      // discord.js-selfbot-v13 method to set hypesquad house
      await client.user.setHypeSquad(houses[choice]);
      await message.channel.send(`\`\`\`HypeSquad set to ${choice}.\`\`\``);
    } catch (err) {
      await message.channel.send(`\`\`\`Failed to update HypeSquad: ${err.message}\`\`\``);
    }
  }
});

export default commands;
export { activeLoops };
