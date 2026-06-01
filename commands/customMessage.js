import fs from 'fs';
import { colors } from '../utils/consoleHelper.js';

const ronPath = './ronmessage_data.json';
const sonPath = './sendonmessage_data.json';
const eonPath = './eonmessage_data.json';

function loadData(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {}
  }
  return {};
}

function saveData(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
}

let ronData = loadData(ronPath);
let sonData = loadData(sonPath);
let eonData = loadData(eonPath);

const commands = [];

// 1. RONMESSAGE command (auto-react)
commands.push({
  name: 'ronmessage',
  execute: async (message, args, client) => {
    const sub = args[0]?.toLowerCase();
    
    if (sub === 'add') {
      const trigger = args[1];
      const reaction = args[2];
      if (!trigger || !reaction) {
        return message.channel.send("```Usage: .ronmessage add <message> <reaction>```");
      }
      ronData[trigger] = { reaction, enabled: true };
      saveData(ronPath, ronData);
      await message.channel.send(`\`\`\`Added reaction ${reaction} to the message "${trigger}".\`\`\``);
    }
    else if (sub === 'remove') {
      const trigger = args.slice(1).join(' ');
      if (ronData[trigger]) {
        delete ronData[trigger];
        saveData(ronPath, ronData);
        await message.channel.send(`\`\`\`Removed the reaction for the message: "${trigger}".\`\`\``);
      } else {
        await message.channel.send("```No reaction found for that message.```");
      }
    }
    else if (sub === 'clear') {
      ronData = {};
      saveData(ronPath, ronData);
      await message.channel.send("```Cleared all ronmessage bindings.```");
    }
    else if (sub === 'on') {
      for (const k in ronData) ronData[k].enabled = true;
      saveData(ronPath, ronData);
      await message.channel.send("```Enabled all reaction messages.```");
    }
    else if (sub === 'off') {
      for (const k in ronData) ronData[k].enabled = false;
      saveData(ronPath, ronData);
      await message.channel.send("```Disabled all reaction messages.```");
    }
    else if (sub === 'list') {
      const entries = Object.entries(ronData);
      if (entries.length === 0) return message.channel.send("```No ronmessage bindings found.```");
      const list = entries.map(([trig, d]) => `Message: "${trig}" | Reaction: ${d.reaction} | Status: ${d.enabled ? 'Enabled' : 'Disabled'}`).join('\n');
      await message.channel.send(`\`\`\`ansi\n\x1b[335mCurrent ronmessage reactions:\n${list}\x1b[0m\`\`\``);
    }
    else {
      await message.channel.send(`\`\`\`ansi
[ ronmessage ] automatic reactions to messages.
    Usage:
        ronmessage add <message> <reaction> - Add reaction to message
        ronmessage list                     - List all reaction messages
        ronmessage remove <message>          - Remove reaction from message
        ronmessage clear                    - Clear all reaction messages
        ronmessage on                       - Enable all reactions
        ronmessage off                      - Disable all reactions
\`\`\``);
    }
  }
});

// 2. SONMESSAGE command (auto-reply)
commands.push({
  name: 'sonmessage',
  aliases: ['sendonmessage'],
  execute: async (message, args, client) => {
    const sub = args[0]?.toLowerCase();
    
    if (sub === 'add') {
      const trigger = args[1];
      const response = args.slice(2).join(' ');
      if (!trigger || !response) {
        return message.channel.send("```Usage: .sonmessage add <message> <response>```");
      }
      sonData[trigger] = { response, enabled: true };
      saveData(sonPath, sonData);
      await message.channel.send(`\`\`\`Added response "${response}" to the message "${trigger}".\`\`\``);
    }
    else if (sub === 'remove') {
      const trigger = args.slice(1).join(' ');
      if (sonData[trigger]) {
        delete sonData[trigger];
        saveData(sonPath, sonData);
        await message.channel.send(`\`\`\`Removed the response for the message: "${trigger}".\`\`\``);
      } else {
        await message.channel.send("```No response found for that message.```");
      }
    }
    else if (sub === 'clear') {
      sonData = {};
      saveData(sonPath, sonData);
      await message.channel.send("```Cleared all sendonmessage bindings.```");
    }
    else if (sub === 'on') {
      for (const k in sonData) sonData[k].enabled = true;
      saveData(sonPath, sonData);
      await message.channel.send("```Enabled all response messages.```");
    }
    else if (sub === 'off') {
      for (const k in sonData) sonData[k].enabled = false;
      saveData(sonPath, sonData);
      await message.channel.send("```Disabled all response messages.```");
    }
    else if (sub === 'list') {
      const entries = Object.entries(sonData);
      if (entries.length === 0) return message.channel.send("```No sendonmessage bindings found.```");
      const list = entries.map(([trig, d]) => `Message: "${trig}" | Response: "${d.response}" | Status: ${d.enabled ? 'Enabled' : 'Disabled'}`).join('\n');
      await message.channel.send(`\`\`\`ansi\n\x1b[335mCurrent sendonmessage replies:\n${list}\x1b[0m\`\`\``);
    }
    else {
      await message.channel.send(`\`\`\`ansi
[ sonmessage ] Automatic responses to messages.
    Usage:
        sonmessage add <message> <response> - Add response to message
        sonmessage list                     - List all response messages
        sonmessage remove <message>          - Remove response from message
        sonmessage clear                    - Clear all response messages
        sonmessage on                       - Enable all responses
        sonmessage off                      - Disable all responses
\`\`\``);
    }
  }
});

// 3. EONMESSAGE command (auto-edit)
commands.push({
  name: 'eonmessage',
  execute: async (message, args, client) => {
    const sub = args[0]?.toLowerCase();
    
    if (sub === 'add') {
      const trigger = args[1];
      const editVal = args.slice(2).join(' ');
      if (!trigger || !editVal) {
        return message.channel.send("```Usage: .eonmessage add <message> <edited_message>```");
      }
      eonData[trigger] = { edited_message: editVal, enabled: true };
      saveData(eonPath, eonData);
      await message.channel.send(`\`\`\`Added edited message: "${editVal}" to the message "${trigger}".\`\`\``);
    }
    else if (sub === 'remove') {
      const trigger = args.slice(1).join(' ');
      if (eonData[trigger]) {
        delete eonData[trigger];
        saveData(eonPath, eonData);
        await message.channel.send(`\`\`\`Removed the edited message for the message: "${trigger}".\`\`\``);
      } else {
        await message.channel.send("```No edited message found for that message.```");
      }
    }
    else if (sub === 'clear') {
      eonData = {};
      saveData(eonPath, eonData);
      await message.channel.send("```Cleared all eonmessage bindings.```");
    }
    else if (sub === 'on') {
      for (const k in eonData) eonData[k].enabled = true;
      saveData(eonPath, eonData);
      await message.channel.send("```Enabled all eonmessage edits.```");
    }
    else if (sub === 'off') {
      for (const k in eonData) eonData[k].enabled = false;
      saveData(eonPath, eonData);
      await message.channel.send("```Disabled all eonmessage edits.```");
    }
    else if (sub === 'list') {
      const entries = Object.entries(eonData);
      if (entries.length === 0) return message.channel.send("```No eonmessage bindings found.```");
      const list = entries.map(([trig, d]) => `Message: "${trig}" | Edit: "${d.edited_message}" | Status: ${d.enabled ? 'Enabled' : 'Disabled'}`).join('\n');
      await message.channel.send(`\`\`\`ansi\n\x1b[335mCurrent eonmessage edits:\n${list}\x1b[0m\`\`\``);
    }
    else {
      await message.channel.send(`\`\`\`ansi
[ eonmessage ] automatic message editing.
    Usage:
        eonmessage add <message> <edited_message> - Add edit mapping
        eonmessage list                           - List all edit messages
        eonmessage remove <message>                - Remove edit mapping
        eonmessage clear                          - Clear all edit mappings
        eonmessage on                             - Enable all edits
        eonmessage off                            - Disable all edits
\`\`\``);
    }
  }
});

// Event listeners to handle message reactions, replies, and edits
export const events = {
  messageCreate: async (message, client) => {
    // Prevent bot from reacting to its own trigger to avoid infinite loops unless it's the edit event
    const content = message.content;
    if (!content) return;

    // 1. Auto React (ronmessage)
    if (ronData[content] && ronData[content].enabled) {
      const emoji = ronData[content].reaction;
      await message.react(emoji).catch(() => {});
    }

    // 2. Auto Reply (sonmessage)
    if (sonData[content] && sonData[content].enabled) {
      if (message.author.id !== client.user.id) {
        const response = sonData[content].response;
        await message.channel.send(response).catch(() => {});
      }
    }

    // 3. Auto Edit (eonmessage - bot's own messages only)
    if (message.author.id === client.user.id && eonData[content] && eonData[content].enabled) {
      const edited = eonData[content].edited_message;
      await message.edit(edited).catch(() => {});
    }
  }
};

export default commands;
export { ronData, sonData, eonData };
