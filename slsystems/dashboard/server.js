const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ==================== PASTE ALL VARIABLE CONFIGURATIONS HERE ====================
const DISCORD_CLIENT_ID = 'YOUR_DISCORD_CLIENT_ID';
const DISCORD_CLIENT_SECRET = 'YOUR_DISCORD_CLIENT_SECRET';
const BOTGHOST_WEBHOOK_URL = 'YOUR_BOTGHOST_WEBHOOK_URL';
const REDIRECT_URI = 'http://localhost:5500/index.html'; // Matches your local frontend server port
// ===============================================================================

app.get('/api/auth-url', (req, res) => {
    const scope = 'identify';
    const url = `https://discord.com{DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope}`;
    res.json({ url });
});

app.post('/api/exchange-code', async (req, res) => {
    const { code } = req.body;
    try {
        const params = new URLSearchParams();
        params.append('client_id', DISCORD_CLIENT_ID);
        params.append('client_secret', DISCORD_CLIENT_SECRET);
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', REDIRECT_URI);

        const tokenResponse = await axios.post('https://discord.com', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const userResponse = await axios.get('https://discord.com', {
            headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
        });

        res.json(userResponse.data);
    } catch (error) {
        res.status(500).json({ error: 'OAuth exchange breakdown.' });
    }
});

app.post('/api/trigger-action', async (req, res) => {
    const { message, userData } = req.body;
    const payload = {
        content: message,
        embeds: [{
            title: "Terminal Dispatch Matrix",
            color: 8128493,
            fields: [
                { name: "User Identity", value: userData ? `${userData.username} (<@${userData.id}>)` : "Unverified Session", inline: true }
            ],
            timestamp: new Date().toISOString()
        }]
    };
    try {
        await axios.post(BOTGHOST_WEBHOOK_URL, payload);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Endpoint routing block.' });
    }
});

app.listen(3000, () => console.log('Proxy system executing at http://localhost:3000'));
