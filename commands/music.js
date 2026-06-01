const commands = [];

const NODES = [
  {
    name: 'serenetia',
    url: 'lavalinkv4.serenetia.com:443',
    auth: 'https://seretia.link/discord',
    secure: true
  }
];

let kazagumo;
let loading;

function msToTime(ms = 0) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getVoiceChannel(message) {
  return message.member?.voice?.channel || message.guild?.me?.voice?.channel || null;
}

function plainTrack(track) {
  const title = track?.title || 'Unknown title';
  const author = track?.author || 'Unknown';
  const duration = track?.length ? msToTime(track.length) : 'live';
  return `${title} - ${author} (${duration})`;
}

async function getMusic(client) {
  if (kazagumo) return kazagumo;
  if (loading) return loading;

  loading = (async () => {
    const [{ Kazagumo }, { Connectors }] = await Promise.all([
      import('kazagumo'),
      import('shoukaku')
    ]);

    const music = new Kazagumo(
      {
        defaultSearchEngine: 'youtube',
        send: (guildId, payload) => {
          const guild = client.guilds.cache.get(guildId);
          if (guild?.shard) guild.shard.send(payload);
        }
      },
      new Connectors.DiscordJS(client),
      NODES
    );

    music.shoukaku.on('ready', name => console.log(`Music node ready: ${name}`));
    music.shoukaku.on('error', (name, err) => console.error(`Music node ${name} error: ${err.message}`));
    music.shoukaku.on('disconnect', name => console.warn(`Music node disconnected: ${name}`));

    music.on('playerEnd', player => {
      if (player.queue.length) player.play();
      else player.destroy();
    });

    kazagumo = music;
    return kazagumo;
  })();

  return loading;
}

function getPlayer(guildId) {
  return kazagumo?.players.get(guildId);
}

commands.push({
  name: 'play',
  aliases: ['p'],
  execute: async (message, args, client) => {
    if (!message.guild) return message.channel.send('```Music works in servers only.```');

    const voiceChannel = getVoiceChannel(message);
    if (!voiceChannel) return message.channel.send('```Join a voice channel first.```');

    const query = args.join(' ').trim();
    if (!query) return message.channel.send('```.play <song or url>```');

    let music;
    try {
      music = await getMusic(client);
    } catch (err) {
      return message.channel.send(`\`\`\`Music system not ready: ${err.message}\`\`\``);
    }

    let player = getPlayer(message.guild.id);
    if (!player) {
      player = await music.createPlayer({
        guildId: message.guild.id,
        voiceId: voiceChannel.id,
        textId: message.channel.id,
        deaf: true
      });
    }

    const result = await music.search(query, { requester: message.author });
    if (!result?.tracks?.length) return message.channel.send('```No results found.```');

    if (result.type === 'PLAYLIST') {
      for (const track of result.tracks) player.queue.add(track);
      await message.channel.send(`\`\`\`Added playlist: ${result.playlistName}\nTracks: ${result.tracks.length}\`\`\``);
    } else {
      const track = result.tracks[0];
      player.queue.add(track);
      await message.channel.send(`\`\`\`Added: ${plainTrack(track)}\`\`\``);
    }

    if (!player.playing && !player.paused) player.play();
  }
});

commands.push({
  name: 'skip',
  aliases: ['s'],
  execute: async (message) => {
    const player = getPlayer(message.guild?.id);
    if (!player) return message.channel.send('```Nothing is playing.```');

    player.skip();
    return message.channel.send('```Skipped.```');
  }
});

commands.push({
  name: 'stop',
  execute: async (message) => {
    const player = getPlayer(message.guild?.id);
    if (!player) return message.channel.send('```Nothing is playing.```');

    player.destroy();
    return message.channel.send('```Stopped and cleared the queue.```');
  }
});

commands.push({
  name: 'pause',
  aliases: ['resume'],
  execute: async (message) => {
    const player = getPlayer(message.guild?.id);
    if (!player) return message.channel.send('```Nothing is playing.```');

    const shouldPause = !player.paused;
    player.pause(shouldPause);
    return message.channel.send(shouldPause ? '```Paused.```' : '```Resumed.```');
  }
});

commands.push({
  name: 'np',
  aliases: ['nowplaying'],
  execute: async (message) => {
    const player = getPlayer(message.guild?.id);
    const current = player?.queue?.current;
    if (!current) return message.channel.send('```Nothing is playing.```');

    return message.channel.send(`\`\`\`Now playing\n${plainTrack(current)}\`\`\``);
  }
});

commands.push({
  name: 'queue',
  aliases: ['q'],
  execute: async (message) => {
    const player = getPlayer(message.guild?.id);
    const current = player?.queue?.current;
    if (!current) return message.channel.send('```Queue is empty.```');

    const upcoming = player.queue.slice(0, 10);
    const lines = [
      `Now playing: ${plainTrack(current)}`,
      '',
      ...upcoming.map((track, index) => `${index + 1}. ${plainTrack(track)}`)
    ];

    if (player.queue.length > 10) {
      lines.push('', `More tracks: ${player.queue.length - 10}`);
    }

    return message.channel.send(`\`\`\`${lines.join('\n')}\`\`\``);
  }
});

commands.push({
  name: 'volume',
  aliases: ['vol'],
  execute: async (message, args) => {
    const player = getPlayer(message.guild?.id);
    if (!player) return message.channel.send('```Nothing is playing.```');

    const volume = Number.parseInt(args[0], 10);
    if (Number.isNaN(volume) || volume < 1 || volume > 100) {
      return message.channel.send('```.volume <1-100>```');
    }

    player.setVolume(volume);
    return message.channel.send(`\`\`\`Volume set to ${volume}%.\`\`\``);
  }
});

export default commands;
