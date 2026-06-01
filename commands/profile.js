import fs from 'fs';
import { colors } from '../utils/consoleHelper.js';

const commands = [];

// Trackers for rotation tasks
const rotations = {
  status: null,
  bio: null,
  pronouns: null,
  pfp: null
};

// 1. DISPLAY NAME & PROFILE SETTERS (.setname, .setpfp, .setbanner, .setbio, .setpronoun)
commands.push({
  name: 'setname',
  execute: async (message, args, client) => {
    const name = args.join(' ');
    if (!name) return message.channel.send("```Usage: .setname <name>```");
    try {
      await client.user.setUsername(name); // changes display name/username
      await message.channel.send(`\`\`\`Display name changed to: ${name}\`\`\``);
    } catch (err) {
      await message.channel.send(`\`\`\`Failed: ${err.message}\`\`\``);
    }
  }
});

commands.push({
  name: 'setpfp',
  execute: async (message, args, client) => {
    const url = args[0] || message.attachments.first()?.url;
    if (!url) return message.channel.send("```Usage: .setpfp <url_or_attachment>```");
    try {
      await client.user.setAvatar(url);
      await message.channel.send("```Avatar set successfully!```");
    } catch (err) {
      await message.channel.send(`\`\`\`Failed: ${err.message}\`\`\``);
    }
  }
});

commands.push({
  name: 'setbanner',
  execute: async (message, args, client) => {
    const url = args[0] || message.attachments.first()?.url;
    if (!url) return message.channel.send("```Usage: .setbanner <url_or_attachment>```");
    try {
      await client.user.setBanner(url);
      await message.channel.send("```Banner set successfully!```");
    } catch (err) {
      await message.channel.send(`\`\`\`Failed: ${err.message}\`\`\``);
    }
  }
});

commands.push({
  name: 'setbio',
  execute: async (message, args, client) => {
    const bio = args.join(' ');
    try {
      await client.user.setAboutMe(bio);
      await message.channel.send(`\`\`\`Bio updated to: "${bio}"\`\`\``);
    } catch (err) {
      await message.channel.send(`\`\`\`Failed: ${err.message}\`\`\``);
    }
  }
});

commands.push({
  name: 'setpronoun',
  execute: async (message, args, client) => {
    const pronouns = args.join(' ');
    try {
      await client.user.setPronouns(pronouns);
      await message.channel.send(`\`\`\`Pronouns updated to: "${pronouns}"\`\`\``);
    } catch (err) {
      await message.channel.send(`\`\`\`Failed: ${err.message}\`\`\``);
    }
  }
});

// 2. PROFILE STEALERS (.stealpfp, .stealbanner, .stealbio, .stealpronoun)
commands.push({
  name: 'stealpfp',
  execute: async (message, args, client) => {
    const target = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.channel.send("```Mention a user to steal from.```");
    
    const avatarUrl = target.displayAvatarURL({ size: 1024, dynamic: true });
    try {
      await client.user.setAvatar(avatarUrl);
      await message.channel.send(`\`\`\`Successfully copied ${target.username}'s avatar.\`\`\``);
    } catch (err) {
      await message.channel.send(`\`\`\`Error: ${err.message}\`\`\``);
    }
  }
});

commands.push({
  name: 'stealbanner',
  execute: async (message, args, client) => {
    const target = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.channel.send("```Mention a user to steal from.```");

    // Fetch user profile to get banner
    const profile = await target.fetch().catch(() => null);
    if (!profile || !profile.banner) {
      return message.channel.send("```User has no banner to steal.```");
    }

    const bannerUrl = profile.bannerURL({ size: 1024, dynamic: true });
    try {
      await client.user.setBanner(bannerUrl);
      await message.channel.send(`\`\`\`Successfully copied ${target.username}'s banner.\`\`\``);
    } catch (err) {
      await message.channel.send(`\`\`\`Error: ${err.message}\`\`\``);
    }
  }
});

commands.push({
  name: 'stealbio',
  execute: async (message, args, client) => {
    const target = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.channel.send("```Mention a user.```");

    const profile = await target.fetch().catch(() => null);
    const bio = profile?.aboutMe || '';
    try {
      await client.user.setAboutMe(bio);
      await message.channel.send(`\`\`\`Successfully stole bio: "${bio}"\`\`\``);
    } catch (err) {
      await message.channel.send(`\`\`\`Error: ${err.message}\`\`\``);
    }
  }
});

commands.push({
  name: 'stealpronoun',
  execute: async (message, args, client) => {
    const target = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.channel.send("```Mention a user.```");

    const profile = await target.fetch().catch(() => null);
    const pronouns = profile?.pronouns || '';
    try {
      await client.user.setPronouns(pronouns);
      await message.channel.send(`\`\`\`Successfully stole pronouns: "${pronouns}"\`\`\``);
    } catch (err) {
      await message.channel.send(`\`\`\`Error: ${err.message}\`\`\``);
    }
  }
});

// 3. COPYPROFILE (Clones whole profile)
commands.push({
  name: 'copyprofile',
  execute: async (message, args, client) => {
    const target = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.channel.send("```Mention a user to copy.```");

    const statusMsg = await message.channel.send("```Cloning profile data...```");
    try {
      const profile = await target.fetch();
      
      // Clone avatar
      const avatarUrl = target.displayAvatarURL({ size: 1024, dynamic: true });
      await client.user.setAvatar(avatarUrl).catch(() => {});
      
      // Clone banner
      if (profile.banner) {
        const bannerUrl = profile.bannerURL({ size: 1024, dynamic: true });
        await client.user.setBanner(bannerUrl).catch(() => {});
      }

      // Clone bio & pronouns
      await client.user.setAboutMe(profile.aboutMe || '').catch(() => {});
      await client.user.setPronouns(profile.pronouns || '').catch(() => {});

      await statusMsg.edit(`\`\`\`Successfully cloned ${target.username}'s profile!\`\`\``);
    } catch (err) {
      await statusMsg.edit(`\`\`\`Failed to copy profile: ${err.message}\`\`\``);
    }
  }
});

// 4. STATUS ROTATION (.rstatus, .stopstatus)
commands.push({
  name: 'rstatus',
  aliases: ['rotate_status'],
  execute: async (message, args, client) => {
    const rawStatuses = args.join(' ');
    if (!rawStatuses) return message.channel.send("```Usage: .rstatus status1 | status2 | status3```");

    const list = rawStatuses.split('|').map(s => s.trim());
    if (rotations.status) clearInterval(rotations.status);

    await message.channel.send(`\`\`\`Started status rotation with ${list.length} items.\`\`\``);
    let idx = 0;
    rotations.status = setInterval(async () => {
      const text = list[idx];
      idx = (idx + 1) % list.length;
      try {
        await client.user.setSettings({ customStatus: { text } });
      } catch (err) {
        console.error("Failed to rotate status:", err.message);
      }
    }, 15000); // 15 seconds
  }
});

commands.push({
  name: 'stopstatus',
  aliases: ['stop_rotate_status', 'rstatusend'],
  execute: async (message, args, client) => {
    if (rotations.status) {
      clearInterval(rotations.status);
      rotations.status = null;
      try {
        await client.user.setSettings({ customStatus: null });
      } catch {}
      await message.channel.send("```Status rotation stopped.```");
    } else {
      await message.channel.send("```Status rotation is not running.```");
    }
  }
});

// 5. BIO ROTATION (.rotatebio, .stoprotatebio)
commands.push({
  name: 'rotatebio',
  execute: async (message, args, client) => {
    const rawBios = args.join(' ');
    if (!rawBios) return message.channel.send("```Usage: .rotatebio bio1 | bio2 | bio3```");

    const list = rawBios.split('|').map(b => b.trim());
    if (rotations.bio) clearInterval(rotations.bio);

    await message.channel.send(`\`\`\`Started bio rotation with ${list.length} items.\`\`\``);
    let idx = 0;
    rotations.bio = setInterval(async () => {
      const text = list[idx];
      idx = (idx + 1) % list.length;
      try {
        await client.user.setAboutMe(text);
      } catch (err) {
        console.error("Failed to rotate bio:", err.message);
      }
    }, 30000); // 30 seconds
  }
});

commands.push({
  name: 'stoprotatebio',
  execute: async (message, args, client) => {
    if (rotations.bio) {
      clearInterval(rotations.bio);
      rotations.bio = null;
      await message.channel.send("```Bio rotation stopped.```");
    } else {
      await message.channel.send("```Bio rotation is not running.```");
    }
  }
});

// 6. PRONOUN ROTATION (.rotatepronoun, .stoprotatepronoun)
commands.push({
  name: 'rotatepronoun',
  execute: async (message, args, client) => {
    const rawPronouns = args.join(' ');
    if (!rawPronouns) return message.channel.send("```Usage: .rotatepronoun pr1 | pr2```");

    const list = rawPronouns.split('|').map(p => p.trim());
    if (rotations.pronouns) clearInterval(rotations.pronouns);

    await message.channel.send(`\`\`\`Started pronoun rotation with ${list.length} items.\`\`\``);
    let idx = 0;
    rotations.pronouns = setInterval(async () => {
      const text = list[idx];
      idx = (idx + 1) % list.length;
      try {
        await client.user.setPronouns(text);
      } catch (err) {
        console.error("Failed to rotate pronouns:", err.message);
      }
    }, 30000);
  }
});

commands.push({
  name: 'stoprotatepronoun',
  execute: async (message, args, client) => {
    if (rotations.pronouns) {
      clearInterval(rotations.pronouns);
      rotations.pronouns = null;
      await message.channel.send("```Pronoun rotation stopped.```");
    } else {
      await message.channel.send("```Pronoun rotation is not running.```");
    }
  }
});

export default commands;
export { rotations };
