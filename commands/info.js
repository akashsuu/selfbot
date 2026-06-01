import fs from 'fs';
import path from 'path';
import { loadTokens } from '../utils/secondaryTokens.js';
import { colors } from '../utils/consoleHelper.js';

const startTime = Date.now();
const themesPath = './themes.json';
const helpPagesPath = './help_pages.json';

// Load help pages JSON
let helpPages = {};
if (fs.existsSync(helpPagesPath)) {
  helpPages = JSON.parse(fs.readFileSync(helpPagesPath, 'utf-8'));
}

// Themes management
let userThemes = {};
if (fs.existsSync(themesPath)) {
  try {
    userThemes = JSON.parse(fs.readFileSync(themesPath, 'utf-8'));
  } catch {}
}

function saveThemes() {
  fs.writeFileSync(themesPath, JSON.stringify(userThemes, null, 4));
}

function getUptime() {
  const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getFriendCount(client) {
  return client.relationships?.friendCache?.size ?? client.relationships?.cache?.size ?? 0;
}

const commands = [];
const purpleAnsi = '\x1b[35m';
const whiteAnsi = '\x1b[37m';
const resetAnsi = '\x1b[0m';

const helpSections = {
  tokens: {
    title: 'Token Management',
    commands: [
      '.addtoken <token> - Add a secondary token',
      '.removetoken <token> - Remove a secondary token',
      '.listtokens / .tok - Show saved secondary tokens',
      '.cleartoken - Clear secondary tokens',
      '.token add/remove/list/clear - Token shortcut menu',
      '.tjoin <invite> <count> - Join tokens to a server'
    ]
  },
  spam: {
    title: 'Spam And Loops',
    commands: [
      '.spam <message> - Repeat a message until stopped',
      '.spamoff - Stop spam',
      '.repeat start <message> - Auto repeat a message',
      '.repeat stop - Stop auto repeat',
      '.repeat delay <seconds> - Set repeat speed',
      '.outlast <user> / .stopoutlast - Outlast loop',
      '.multilast <user> / .stopmultilast - Multi-token outlast',
      '.mping / .mpingoff - Mass ping loop',
      '.invis / .invisoff - Invisible text loop'
    ]
  },
  profile: {
    title: 'Profile',
    commands: [
      '.setname <name> - Change display name',
      '.setpfp <url or attachment> - Change avatar',
      '.setbanner <url or attachment> - Change banner',
      '.setbio <text> - Change bio',
      '.setpronoun <text> - Change pronouns',
      '.stealpfp <user> - Copy user avatar',
      '.stealbanner <user> - Copy user banner',
      '.stealbio <user> - Copy user bio',
      '.copyprofile <user> - Copy available profile fields',
      '.rstatus text1 | text2 - Rotate status',
      '.stopstatus / .rstatusend - Stop status rotation'
    ]
  },
  media: {
    title: 'Anime And Media',
    commands: [
      '.kiss/.hug/.pat/.slap <user> - Anime action GIF',
      '.wink/.dance/.cry/.smile - Solo anime action',
      '.hentai/.maid/.oppai/.uniform - Image commands',
      '.imgdump - Dump images from channel',
      '.gifdump - Dump GIFs from channel',
      '.mp4dump / .movdump - Dump videos from channel'
    ]
  },
  utility: {
    title: 'Utility',
    commands: [
      '.say <message> - Send/edit message',
      '.say <token_index> <message> - Send from secondary token',
      '.mimic <user> - Mimic a user',
      '.mimicoff - Stop mimic',
      '.nickname <name> - Change server nickname',
      '.bsearch <query> - Search in browser',
      '.roblox <username> - Lookup Roblox user',
      '.opencalc / .openpad - Open Windows tools',
      '.dfolder <name> - Create Desktop folder',
      '.cleartemp - Clear temp files'
    ]
  },
  protection: {
    title: 'Protection',
    commands: [
      '.detection on/off - Toggle raid detection',
      '.setpunishment ban/kick/timeout - Set punishment',
      '.swhitelist <user> - Add whitelist user',
      '.sunwhitelist <user> - Remove whitelist user',
      '.softban <user> - Softban user',
      '.hardban <user> - Hardban user',
      '.unhardban <user> - Remove hardban',
      '.ghostban <user_id> - Add ghostban',
      '.banlist - Show ban list',
      '.protectionstats - Show protection settings',
      '.antigcspam - Group chat protection menu'
    ]
  },
  voice: {
    title: 'Voice',
    commands: [
      '.vcjoin stable <channel_id> - Join voice channel',
      '.vcjoin leave - Leave voice channel',
      '.vcmulti / .multivc <channel_id> - Join secondary tokens',
      '.vcend - Disconnect secondary voice clients'
    ]
  },
  music: {
    title: 'Music',
    commands: [
      '.play <song or url> - Play music',
      '.skip - Skip current track',
      '.stop - Stop music and clear queue',
      '.pause / .resume - Pause or resume music',
      '.np - Show current track',
      '.queue - Show queue',
      '.volume <1-100> - Set volume'
    ]
  },
  auto: {
    title: 'Auto Responses',
    commands: [
      '.ronmessage add <text> <emoji> - Auto-react to text',
      '.ronmessage list/remove/clear/on/off - Manage reactions',
      '.sonmessage add <text> <reply> - Auto-reply to text',
      '.sonmessage list/remove/clear/on/off - Manage replies',
      '.eonmessage add <text> <edit> - Auto-edit matching messages',
      '.eonmessage list/remove/clear/on/off - Manage edits',
      '.ladder start/stop - Auto ladder loop',
      '.ladder add/remove/list/clear/delay/status - Manage ladder'
    ]
  }
};

function buildHelp(category) {
  const key = category?.toLowerCase();
  if (key && helpSections[key]) {
    const section = helpSections[key];
    return [
      `${purpleAnsi}${section.title}${whiteAnsi}`,
      `${purpleAnsi}Prefix:${whiteAnsi} .`,
      '',
      ...section.commands.map(command => `${purpleAnsi}${command.split(' - ')[0]}${whiteAnsi} - ${command.split(' - ').slice(1).join(' - ')}`),
      resetAnsi
    ].join('\n');
  }

  const categories = Object.entries(helpSections)
    .map(([name, section]) => `${purpleAnsi}.help ${name.padEnd(10)}${whiteAnsi} - ${section.title}`)
    .join('\n');

  return [
    `${purpleAnsi}akashsuu Selfbot Help${whiteAnsi}`,
    `${purpleAnsi}Prefix:${whiteAnsi} .`,
    `${purpleAnsi}Created and developed by${whiteAnsi} akashsuu`,
    '',
    `${purpleAnsi}Main commands:${whiteAnsi}`,
    `${purpleAnsi}.info${whiteAnsi}              - Bot status`,
    `${purpleAnsi}.help <category>${whiteAnsi}   - Show commands in a category`,
    `${purpleAnsi}.theme${whiteAnsi}             - Show purple/white theme settings`,
    '',
    `${purpleAnsi}Categories:${whiteAnsi}`,
    categories,
    resetAnsi
  ].join('\n');
}

async function sendHelp(message, args = []) {
  await message.channel.send(`\`\`\`ansi\n${buildHelp(args[0])}\n\`\`\``);
}

// 1. INFO command
commands.push({
  name: 'info',
  execute: async (message, args, client) => {
    const tokens = loadTokens();
    const uptime = getUptime();
    
    const accent = colors.lightMagenta;
    const reset = colors.reset;
    const white = colors.white;
    const purple = colors.lightMagenta;
    
    await message.channel.send(`\`\`\`ansi
              ${purple}   ___    _  __   ___    ____  _   _  ____  _   _  _   _${white}
              ${purple}  / _ \\  | |/ /  / _ \\  / ___|| | | |/ ___|| | | || | | |${white}
              ${purple} / /_\\ \\ | ' /  / /_\\ \\ \\___ \\| |_| |\\___ \\| | | || | | |${white}
              ${purple}|  _  | | . \\  |  _  |  ___) |  _  | ___) | |_| || |_| |${white}
              ${purple}|_| |_| |_|\\_\\ |_| |_| |____/|_| |_||____/ \\___/  \\___/ ${white}

              ${purple}akashsuu selfbot${white}
              ${white}created and developed by ${accent}akashsuu${white}

              ${purple}>${white} welcome ${accent}${client.user.tag}${white}
              ${purple}>${white} prefix  ${accent}.${white}
              ${purple}>${white} version ${accent}JS Dev${white}
              ${purple}>${white} servers ${accent}${client.guilds.cache.size}${white}
              ${purple}>${white} friends ${accent}${getFriendCount(client)}${white}
              ${purple}>${white} tokens  ${accent}${tokens.length}${white}
              ${purple}>${white} uptime  ${accent}${uptime}${white}
    ${reset}\`\`\``);
  }
});

// 2. MENU command
commands.push({
  name: 'menu',
  aliases: ['help', 'commands'],
  execute: async (message, args, client) => {
    await sendHelp(message, args);
  }
});

// 3. MENU2 command
commands.push({
  name: 'menu2',
  execute: async (message, args, client) => {
    await sendHelp(message, args);
  }
});

// 4. MENU3 command
commands.push({
  name: 'menu3',
  execute: async (message, args, client) => {
    await sendHelp(message, args);
  }
});

// 5. THEME selection command (.theme)
commands.push({
  name: 'theme',
  execute: async (message, args, client) => {
    const currentTheme = 'purple-white';
    let pageNum = 't1';
    
    const renderPage = (p) => {
      let content = helpPages[p] || '';
      return content.replace('{current_theme}', currentTheme);
    };

    const themeMsg = await message.channel.send(renderPage(pageNum));

    // Await message collector to navigate or select
    const filter = m => m.author.id === message.author.id && (
      (m.content.startsWith('t') && !isNaN(m.content.slice(1)) && parseInt(m.content.slice(1)) >= 1 && parseInt(m.content.slice(1)) <= 7) ||
      m.content.startsWith('.tselect')
    );

    const collector = message.channel.createMessageCollector({ filter, time: 30000 });

    collector.on('collect', async (msg) => {
      try {
        await msg.delete();
      } catch {}

      if (msg.content.startsWith('.tselect')) {
        const parts = msg.content.split(' ');
        if (parts.length >= 2) {
          const selectedColor = parts[1].toLowerCase();
          const validColors = ['purple', 'white', 'purple-white'];
          if (validColors.includes(selectedColor)) {
            userThemes[message.author.id] = selectedColor;
            saveThemes();
            const confirm = await message.channel.send(`\`\`\`ansi\nTheme set to ${selectedColor}\`\`\``);
            setTimeout(() => confirm.delete().catch(() => {}), 3000);
            try { await themeMsg.delete(); } catch {}
            collector.stop();
          }
        }
      } else if (msg.content.startsWith('t')) {
        const idx = msg.content.slice(1);
        pageNum = `t${idx}`;
        if (helpPages[pageNum]) {
          await themeMsg.edit(renderPage(pageNum));
        }
      }
    });

    collector.on('end', () => {
      // Done
    });
  }
});

// 6. Dynamic p1 - p29 commands
for (let i = 1; i <= 29; i++) {
  commands.push({
    name: `p${i}`,
    execute: async (message, args, client) => {
      const pageContent = helpPages[String(i)];
      if (pageContent) {
        await message.channel.send(`\`\`\`ansi\n${pageContent}\`\`\``);
      } else {
        await message.channel.send(`\`\`\`Page ${i} help contents not found.\`\`\``);
      }
    }
  });
}

// 7. Dynamic t1 - t7 commands
for (let i = 1; i <= 7; i++) {
  commands.push({
    name: `t${i}`,
    execute: async (message, args, client) => {
      const currentTheme = 'purple-white';
      const pageContent = helpPages[`t${i}`];
      if (pageContent) {
        const rendered = pageContent.replace('{current_theme}', currentTheme);
        await message.channel.send(rendered);
      } else {
        await message.channel.send(`\`\`\`Theme page t${i} not found.\`\`\``);
      }
    }
  });
}

export default commands;
export { userThemes };
