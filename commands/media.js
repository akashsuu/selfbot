import { fetchAnimeGif } from '../utils/waifuHelper.js';
import { colors } from '../utils/consoleHelper.js';

const commands = [];

// SFW roleplay actions with target mentions
const sfwActions = {
  kiss: { msg: "sends an anime kiss to", emoji: "💋" },
  slap: { msg: "slaps", emoji: "👋" },
  hug: { msg: "hugs", emoji: "🤗" },
  pat: { msg: "pats", emoji: "👋" },
  wave: { msg: "waves at", emoji: "👋" },
  cuddle: { msg: "cuddles", emoji: "🤗" },
  handhold: { msg: "holds hands with", emoji: "🤝" },
  highfive: { msg: "high-fives", emoji: "🙌" },
  poke: { msg: "pokes", emoji: "👉" },
  nom: { msg: "noms on", emoji: "😋" },
  bite: { msg: "bites", emoji: "😬" },
  bully: { msg: "bullies", emoji: "👊" },
  lick: { msg: "licks", emoji: "👅" },
  hurt: { msg: "hurts", emoji: "🤕" },
  bonk: { msg: "bonks", emoji: "🔨" },
  yeet: { msg: "yeets", emoji: "✈️" }
};

// SFW solo actions without target mentions
const sfwSolo = {
  wink: { msg: "winks", emoji: "😉" },
  dance: { msg: "dances", emoji: "💃" },
  smug: { msg: "shows a smug expression", emoji: "😏" },
  cry: { msg: "cries", emoji: "😭" },
  sleep: { msg: "falls asleep", emoji: "💤" },
  blush: { msg: "blushes", emoji: "😳" },
  smile: { msg: "smiles", emoji: "😊" }
};

// Bind SFW actions
for (const [action, meta] of Object.entries(sfwActions)) {
  commands.push({
    name: action,
    execute: async (message, args, client) => {
      const target = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
      if (!target) return message.channel.send(`\`\`\`You need to mention someone to ${action}!\`\`\``);

      const gifUrl = await fetchAnimeGif(action, false);
      if (gifUrl) {
        await message.channel.send(`\`\`\`${message.author.username} ${meta.msg} ${target.username}! ${meta.emoji}\`\`\`\n[akashsuu sb](${gifUrl})`);
      } else {
        await message.channel.send(`\`\`\`Couldn't fetch an anime ${action} GIF right now, try again later!\`\`\``);
      }
    }
  });
}

// Bind SFW solo actions
for (const [action, meta] of Object.entries(sfwSolo)) {
  commands.push({
    name: action,
    execute: async (message, args, client) => {
      const gifUrl = await fetchAnimeGif(action, false);
      if (gifUrl) {
        await message.channel.send(`\`\`\`${message.author.username} ${meta.msg}! ${meta.emoji}\`\`\`\n[akashsuu sb](${gifUrl})`);
      } else {
        await message.channel.send(`\`\`\`Couldn't fetch an anime ${action} GIF right now!\`\`\``);
      }
    }
  });
}

// NSFW Waifu.im searches
const nsfwTags = ['hentai', 'uniform', 'maid', 'oppai', 'selfies', 'ero', 'ecchi'];

for (const tag of nsfwTags) {
  commands.push({
    name: tag,
    execute: async (message, args, client) => {
      // In python, it queried waifu.im
      const gifUrl = await fetchAnimeGif(tag, true);
      if (gifUrl) {
        await message.channel.send(`\`\`\`${message.author.username} shares some ${tag} content\`\`\`\n[akashsuu sb](${gifUrl})`);
      } else {
        await message.channel.send(`\`\`\`Failed to fetch ${tag} image, try again later!\`\`\``);
      }
    }
  });
}

// Custom anime characters (Raiden Shogun / Marin Kitagawa)
const characters = ['raiden', 'marin'];
for (const char of characters) {
  commands.push({
    name: char,
    execute: async (message, args, client) => {
      // Fetch SFW or NSFW from waifu.pics/im
      const gifUrl = await fetchAnimeGif(char, false).catch(() => null) || await fetchAnimeGif(char === 'raiden' ? 'uniform' : 'maid', true);
      if (gifUrl) {
        await message.channel.send(`\`\`\`${message.author.username} shares some ${char} art\`\`\`\n[akashsuu sb](${gifUrl})`);
      } else {
        await message.channel.send(`\`\`\`Failed to fetch ${char} image, try again later!\`\`\``);
      }
    }
  });
}

// Attachment dumping helper
async function dumpAttachments(message, limit, typeFilter) {
  const statusMsg = await message.channel.send("```Scanning channel history for attachments...```");
  try {
    const msgs = await message.channel.messages.fetch({ limit });
    const urls = [];
    msgs.forEach(m => {
      m.attachments.forEach(a => {
        const matchesType = typeFilter(a.contentType, a.name);
        if (matchesType) {
          urls.push(a.url);
        }
      });
    });

    if (urls.length === 0) {
      return statusMsg.edit("```No matching attachments found in channel history.```");
    }

    const output = urls.join('\n');
    await statusMsg.edit(`\`\`\`ansi\n\x1b[335mDumped ${urls.length} files:\x1b[0m\`\`\n${output.slice(0, 1900)}`);
  } catch (err) {
    await statusMsg.edit(`\`\`\`Failed to dump: ${err.message}\`\`\``);
  }
}

commands.push({
  name: 'imgdump',
  execute: async (message, args, client) => {
    const limit = parseInt(args[0]) || 50;
    await dumpAttachments(message, limit, (ct, name) => 
      (ct && ct.startsWith('image/')) || (name && /\.(png|jpe?g|webp)$/i.test(name))
    );
  }
});

commands.push({
  name: 'gifdump',
  execute: async (message, args, client) => {
    const limit = parseInt(args[0]) || 50;
    await dumpAttachments(message, limit, (ct, name) => 
      (ct && ct.includes('gif')) || (name && /\.gif$/i.test(name))
    );
  }
});

commands.push({
  name: 'mp4dump',
  aliases: ['movdump'],
  execute: async (message, args, client) => {
    const limit = parseInt(args[0]) || 50;
    await dumpAttachments(message, limit, (ct, name) => 
      (ct && ct.startsWith('video/')) || (name && /\.(mp4|mov|avi|mkv|webm)$/i.test(name))
    );
  }
});

export default commands;
