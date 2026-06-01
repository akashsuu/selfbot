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

// 1. INFO command
commands.push({
  name: 'info',
  execute: async (message, args, client) => {
    const tokens = loadTokens();
    const uptime = getUptime();
    
    // Resolve theme for user
    const themeColor = userThemes[message.author.id] || 'magenta';
    const accent = colors[themeColor] || colors.magenta;
    const reset = colors.reset;
    const white = colors.white;
    const yellow = colors.yellow;
    
    const botUser = `Welcome : ${client.user.tag.slice(0, 25).padEnd(25)}`;
    const botPrefix = `Prefix  : .                        `;
    const version = `Version : JS Dev                   `;
    const serverCount = `Servers : ${String(client.guilds.cache.size).padEnd(25)}`;
    const friendCount = `Friends : ${String(getFriendCount(client)).padEnd(25)}`;
    const tokenCount = `Tokens  : ${String(tokens.length).padEnd(25)}`;
    const uptimeStr = `Uptime  : ${uptime.padEnd(25)}`;
    
    const boxWidth = 35;
    const borderLine = "═".repeat(boxWidth + 2);
    
    await message.channel.send(`\`\`\`ansi
                                            ${yellow}╔═╗╔═╗╔═╗ ╦ ╦╔═╗╔╦╗╔╦╗╔═╗  ╔═╗╔═╗╦  ╔═╗╔╗ ╔═╗╔╦╗
                                            ${yellow}║  ║ ║║═╬╗║ ║║╣  ║  ║ ║╣   ╚═╗║╣ ║  ╠╣ ╠╩╗║ ║ ║ 
                                             ${white}╚═╝╚═╝╚═╝╚╚═╝╚═╝ ╩  ╩ ╚═╝  ╚═╝╚═╝╩═╝╚  ╚═╝╚═╝ ╩  ${colors.red}By exaell. ${colors.cyan}/${colors.red} nasa
                                            ${yellow}╔${borderLine}╗
                                            ${yellow}║ ${white}Welcome : ${accent}${client.user.tag.slice(0,25).padEnd(25)} ${yellow}║
                                            ${yellow}║ ${white}Prefix  : ${accent}.${"".padEnd(24)} ${yellow}║
                                            ${yellow}║ ${white}Version : ${accent}JS Dev${"".padEnd(19)} ${yellow}║
                                            ${yellow}║ ${white}Servers : ${accent}${String(client.guilds.cache.size).padEnd(25)} ${yellow}║
                                            ${yellow}║ ${white}Friends : ${accent}${String(getFriendCount(client)).padEnd(25)} ${yellow}║
                                            ${yellow}║ ${white}Tokens  : ${accent}${String(tokens.length).padEnd(25)} ${yellow}║  
                                            ${yellow}║ ${white}Uptime  : ${accent}${uptime.padEnd(25)} ${yellow}║
                                            ${yellow}╚${borderLine}╝
    ${reset}\`\`\``);
  }
});

// 2. MENU command
commands.push({
  name: 'menu',
  aliases: ['help', 'commands'],
  execute: async (message, args, client) => {
    const blue = colors.blue;
    const red = colors.red;
    const magenta = colors.magenta;
    const white = colors.white;
    const reset = colors.reset;
    
    await message.channel.send(`\`\`\`ansi
${blue}────────────Dont RUN────────────
${red}akashsuu ${blue}Selfbot JS.
${blue}────────────Dont RUN────────────

${magenta}[ ${white}.p1 ${magenta}] ${white}Multi Token Management & Autoresponse
${blue}[ ${white}.p2 ${blue}] ${white}Spam & Message Formatting
${magenta}[ ${white}.p3 ${magenta}] ${white}Reaction & server/user info 
${blue}[ ${white}.p4 ${blue}] ${white}Utility & User Interaction
${magenta}[ ${white}.p5 ${magenta}] ${white}Message & Server Management
${blue}[ ${white}.p6 ${blue}] ${white}Backup & Friendly Actions
${magenta}[ ${white}.p7 ${magenta}] ${white}Playfull action & Agressive actions
${blue}[ ${white}.p8 ${blue}] ${white}Emoji management, Antinuke & server/group action
${magenta}[ ${white}.p9 ${magenta}] ${white}Ping response & Reaction System
${blue}[ ${white}.p10 ${blue}] ${white}AFK check & User control
${magenta}[ ${white}.menu2 ${magenta}] ${white}For Next Page
\`\`\``);
  }
});

// 3. MENU2 command
commands.push({
  name: 'menu2',
  execute: async (message, args, client) => {
    const blue = colors.blue;
    const red = colors.red;
    const magenta = colors.magenta;
    const white = colors.white;
    const reset = colors.reset;
    
    await message.channel.send(`\`\`\`ansi
${blue}────────────Dont RUN────────────
${red}akashsuu ${blue}Selfbot JS.
${blue}────────────Dont RUN────────────

${magenta}[ ${white}.p11 ${magenta}] ${white}Message control and Nuking
${blue}[ ${white}.p12 ${blue}] ${white}More Nuking & Spotify Control
${magenta}[ ${white}.p13 ${magenta}] ${white}Profile customization & bio/status management
${blue}[ ${white}.p14 ${blue}] ${white}Name/Pronounce & Server voice management
${magenta}[ ${white}.p15 ${magenta}] ${white}Message Reaction & Response System
${blue}[ ${white}.p16 ${blue}] ${white}Message Edit System & Notification Systems
${magenta}[ ${white}.p17 ${magenta}] ${white}Screenshot Management & Windows Utilities
${blue}[ ${white}.p18 ${blue}] ${white}Social Media Search & NSFW Content 
${magenta}[ ${white}.p19 ${magenta}] ${white}Main Commands & Utility Commands
${blue}[ ${white}.p20 ${blue}] ${white}Token Utility & Friend & Block Utility
${magenta}[ ${white}.menu3 ${magenta}] ${white}For Next Page
\`\`\``);
  }
});

// 4. MENU3 command
commands.push({
  name: 'menu3',
  execute: async (message, args, client) => {
    const blue = colors.blue;
    const red = colors.red;
    const magenta = colors.magenta;
    const white = colors.white;
    const reset = colors.reset;
    
    await message.channel.send(`\`\`\`ansi
${blue}────────────Dont RUN────────────
${red}akashsuu ${blue}Selfbot JS.
${blue}────────────Dont RUN────────────
${magenta}[ ${white}.p21 ${magenta}] ${white}Auto Press Commands & Auto Kill Commands
${blue}[ ${white}.p22 ${blue}] ${white}Manual Mode Commands & Multi Press & Random
${magenta}[ ${white}.p23 ${magenta}] ${white}Multi/Vc Commands & Auto Multi Commands
${blue}[ ${white}.p24 ${blue}] ${white}Auto Leave Systems & Autorepeat
${magenta}[ ${white}.p25 ${magenta}] ${white}Anti GC spam 
${blue}[ ${white}.p26 ${blue}] ${white}Anti GC Spam Advanced & Rotate Systems
${magenta}[ ${white}.p27 ${magenta}] ${white}Message Sniper System & Anti LastWord & Random
${blue}[ ${white}.p28 ${blue}] ${white}Server Edit
${magenta}[ ${white}.p29 ${magenta}] ${white}Image Dumping & Guild & Token Management
${blue}[ ${white}.menu ${blue}] ${white}Back To Main Menu
\`\`\``);
  }
});

// 5. THEME selection command (.theme)
commands.push({
  name: 'theme',
  execute: async (message, args, client) => {
    const currentTheme = userThemes[message.author.id] || 'magenta';
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
          const validColors = ['red', 'blue', 'magenta', 'cyan', 'green', 'yellow', 'purple'];
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
      const currentTheme = userThemes[message.author.id] || 'magenta';
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
