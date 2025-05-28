const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const NEXUS_API_URL = 'https://api.nexusmods.com/v1/games/starwarsbattlefront22017/mods/11814.json';
const NEXUS_API_KEY = process.env.NEXUS_API_KEY;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const POLL_INTERVAL = 60000; // Poll every 60 seconds
const PORT = process.env.PORT || 10000; // Render's default port

let lastUpdated = null;

// Basic endpoint to satisfy Render's Web Service requirement
app.get('/', (req, res) => {
  res.send('Nexus Mod Monitor for Mod ID 11814 is running!');
});

async function pollNexusAPI() {
  if (!NEXUS_API_KEY) {
    console.error('NEXUS_API_KEY is not set in environment variables');
    return;
  }
  if (!DISCORD_WEBHOOK_URL) {
    console.error('DISCORD_WEBHOOK_URL is not set in environment variables');
    return;
  }

  try {
    const response = await axios.get(NEXUS_API_URL, {
      headers: {
        'apikey': NEXUS_API_KEY // Correct header for Nexus Mods API
      },
      params: lastUpdated ? { updated_since: lastUpdated } : {}
    });

    const modData = response.data;
    if (modData && modData.updated_timestamp && (!lastUpdated || modData.updated_timestamp > lastUpdated)) {
      console.log('Mod updated:', modData);
      lastUpdated = modData.updated_timestamp;

      try {
        await axios.post(DISCORD_WEBHOOK_URL, {
          content: "📡 Incoming transmission from 🔧 SYSTEM UPDATE...   🛠️ STATUS: Deployed and operational.  📍 Location: Central Repository of NEXUS <<Holocron Archives>>  📄 End of transmission. May the source be with you.  [Check #downloads](https://discord.com/channels/1361838672265089225/1363402560756781207)",
          embeds: [
            {
              title: `Holocron Update: ${modData.name} (ID: ${modData.mod_id})`,
              description: `A new version of **${modData.name}** has been detected in the Nexus Archives.`,
              color: 0xFFD700, // Gold color for a Star Wars kyber crystal theme
              fields: [
                { name: "Version", value: modData.version || "N/A", inline: true },
                { name: "Updated", value: new Date(modData.updated_timestamp * 1000).toISOString().split('.')[0] + 'Z', inline: true },
                { name: "Author", value: modData.author || "Unknown", inline: true },
                { name: "Downloads", value: `${modData.mod_downloads} (${modData.mod_unique_downloads} unique)`, inline: true },
                { name: "Summary", value: modData.summary.replace(/<br \/>/g, '\n').substring(0, 200) + (modData.summary.length > 200 ? '...' : '') },
              ],
              thumbnail: { url: modData.picture_url || '' },
              footer: { text: "Retrieved from Nexus Mods Archives" },
              timestamp: new Date().toISOString()
            }
          ]
        });
        console.log('Discord notification sent');
      } catch (discordErr) {
        console.error('Error sending Discord webhook:', discordErr.message);
      }
    } else {
      console.log('No new updates for mod ID 11814');
    }
  } catch (err) {
    console.error('Error polling Nexus Mods API:', err.message, err.response?.status, err.response?.data);
  }
}

// Start polling
setInterval(pollNexusAPI, POLL_INTERVAL);
pollNexusAPI(); // Run immediately on startup

app.listen(PORT, () => {
  console.log(`Nexus Mod Monitor running on port ${PORT}`);
});
