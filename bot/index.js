require("dotenv").config({ override: true });
const Discord = require('discord.js');
const express = require('express');
const axios = require('axios');

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildPresences,
    Discord.GatewayIntentBits.GuildMembers,
  ],
})

const app = express();
const PORT = process.env.PORT || 3000;

let yourActivity = {
  status: 'offline',
  activities: [],
}

async function updateActivity() {
  try {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return;

    const member = await guild.members.fetch(process.env.MY_DISCORD_ID);
    if (!member || !member.presence) return;

    const activities = await Promise.all(
      member.presence.activities.map(async (a) => {
        let gameIcon;

        if (a.type === 0) {
          if (a.applicationId === null) return;

          const gameAsset = await axios.get(`https://discord.com/api/v10/oauth2/applications/${a.applicationId}/rpc`);
          gameIcon = `https://cdn.discordapp.com/app-icons/${a.applicationId}/${gameAsset.data.icon}`;
        }

        return {
          name: a.name,
          type: a.type,
          details: a.details,
          state: a.state,
          timestamps: a.timestamps,
          assets: gameIcon === undefined ? a.assets : { largeImage: gameIcon },
        };
      })
    );

    yourActivity = {
      username: member.user.username,
      avatar: member.user.displayAvatarURL({ size: 256 }),
      status: member.presence.status,
      activities: activities.filter(Boolean),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Ошибка обновления активности:', error);
  }
}

client.on('ready', () => {
  console.log(`Бот запущен как ${client.user.tag}`)
  setInterval(updateActivity, 10_000) // Обновляем каждые 10 сек
  updateActivity()
})

client.on('presenceUpdate', (_, newPresence) => {
  if (newPresence.userId === process.env.MY_DISCORD_ID) updateActivity()
})

app.get('/api/activity', (req, res) => {
  res.json(yourActivity)
})

client.login(process.env.BOT_TOKEN);

app.listen(PORT, () => {
  console.log(`API доступен на http://localhost:${PORT}/api/activity`)
})
