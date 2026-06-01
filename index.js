import fs from 'fs';
import path from 'path';
import { Client } from 'discord.js-selfbot-v13';
import { makeConsoleTransparent, showStartupAnimation, colors } from './utils/consoleHelper.js';

// Configuration check
if (!fs.existsSync('./config.json')) {
  console.error("Error: config.json file not found. Please create the file with your bot token.");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
const token = config.token;

if (!token || token === "YOUR TOKEN") {
  console.error("Error: Token not found in config.json.");
  process.exit(1);
}

// Initialize discord selfbot client
const client = new Client({
  checkUpdate: false
});

client.commands = new Map();
client.aliases = new Map();
client.events = new Map();

function getFriendCount(client) {
  return client.relationships?.friendCache?.size ?? client.relationships?.cache?.size ?? 0;
}

async function showCommandTyping(message) {
  if (typeof message.channel?.sendTyping !== 'function') return;

  try {
    await message.channel.sendTyping();
    await new Promise(resolve => setTimeout(resolve, 600));
  } catch {}
}

// Helper to load command files dynamically
async function loadCommands() {
  const commandsPath = './commands';
  if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath);
  }

  const files = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of files) {
    try {
      const module = await import(`./commands/${file}`);
      const exported = module.default;
      const cmds = Array.isArray(exported) ? exported : [exported];
      for (const command of cmds) {
        if (command && command.name) {
          client.commands.set(command.name.toLowerCase(), command);
          if (command.aliases && Array.isArray(command.aliases)) {
            for (const alias of command.aliases) {
              client.aliases.set(alias.toLowerCase(), command.name.toLowerCase());
            }
          }
          console.log(`Loaded command: ${command.name}`);
        }
      }
      
      // Load event listeners from the module if exported
      if (module.events) {
        for (const [eventName, handler] of Object.entries(module.events)) {
          if (!client.events.has(eventName)) {
            client.events.set(eventName, []);
          }
          client.events.get(eventName).push(handler);
          console.log(`Registered event listener for: ${eventName}`);
        }
      }
    } catch (error) {
      console.error(`Failed to load command file ${file}:`, error);
    }
  }
}

// Hook all event files/handlers
async function initEvents() {
  // messageCreate: main dispatcher
  client.on('messageCreate', async (message) => {
    // 1. Process client prefix commands (.command)
    const prefix = '.';
    if (message.author.id === client.user.id && message.content.startsWith(prefix)) {
      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      const actualCommandName = client.commands.has(commandName) 
        ? commandName 
        : client.aliases.get(commandName);

      if (actualCommandName) {
        const command = client.commands.get(actualCommandName);
        try {
          await showCommandTyping(message);
          await command.execute(message, args, client);
        } catch (error) {
          console.error(`Error executing command ${actualCommandName}:`, error);
          try {
            await message.channel.send(`\`\`\`Error executing command: ${error.message}\`\`\``);
          } catch {}
        }
      }
    }

  // 2. Delegate to active listeners (e.g. custom responses, antiGC, sniper, etc.)
    const handlers = client.events.get('messageCreate');
    if (handlers) {
      for (const handler of handlers) {
        try {
          await handler(message, client);
        } catch (err) {
          console.error(`Error in event listener messageCreate:`, err);
        }
      }
    }
  });

  // Bind other raw discord.js events to our dynamically registered handlers
  const discordEvents = [
    'messageDelete', 'messageUpdate', 'guildMemberAdd', 'guildMemberRemove', 
    'channelCreate', 'channelDelete', 'roleCreate', 'roleDelete', 'guildUpdate', 'voiceStateUpdate'
  ];

  for (const event of discordEvents) {
    client.on(event, async (...args) => {
      const handlers = client.events.get(event);
      if (handlers) {
        for (const handler of handlers) {
          try {
            await handler(...args, client);
          } catch (err) {
            console.error(`Error in event handler ${event}:`, err);
          }
        }
      }
    });
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Render the akashsuu ready console UI.
  const purple = colors.lightMagenta;
  const white = colors.white;
  const muted = colors.lightGray || colors.gray || white;
  const botUser = client.user.tag;
  const serverCount = String(client.guilds.cache.size);
  const friendCount = String(getFriendCount(client));

  const mainUi = `

                          ${purple}akashsuu${white}

                          ${purple}akashsuu SELFBOT${white} ${muted}// JS EDITION${white}
                          ${muted}created and developed by${white} ${purple}akashsuu${white}

                          ${purple}>${white} welcome   ${muted}:${white} ${purple}${botUser}${white}
                          ${purple}>${white} prefix    ${muted}:${white} ${purple}.${white}
                          ${purple}>${white} version   ${muted}:${white} ${purple}JS V1.1.6 Host${white}
                          ${purple}>${white} servers   ${muted}:${white} ${purple}${serverCount}${white}
                          ${purple}>${white} friends   ${muted}:${white} ${purple}${friendCount}${white}
  `;
  console.log(mainUi);
});

async function main() {
  // Show premium loading splash screen
  await showStartupAnimation();
  
  // Set terminal window transparency (Windows only)
  makeConsoleTransparent(0.3);

  // Initialize systems
  await loadCommands();
  await initEvents();

  // Log in user client
  console.log("Connecting to Discord...");
  await client.login(token);
}

main().catch(err => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
export { client };
