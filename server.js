const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/download', async (req, res) => {
    const { url } = req.body;
    
    if (!url || !url.includes('instagram.com')) {
        return res.status(400).json({ error: 'Please enter a valid Instagram URL' });
    }

    // List of alternative APIs to try
    const apis = [
        `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`,
        `https://instagramdl.herokuapp.com/api/instagram?url=${encodeURIComponent(url)}`,
        `https://instasave.xyz/api?url=${encodeURIComponent(url)}`
    ];
    
    for (const apiUrl of apis) {
        try {
            const response = await axios.get(apiUrl, {
                timeout: 8000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            
            if (response.data && (response.data.video_url || response.data.video)) {
                const videoUrl = response.data.video_url || response.data.video;
                return res.json({ success: true, videoUrl: videoUrl });
            }
        } catch (e) {
            continue; // Try next API
        }
    }
    
    // If all APIs fail, return the workaround URL
    const workaroundUrl = url.replace('instagram.com', 'f-d.app/instagram.com');
    res.status(200).json({ 
        success: false,
        workaround: workaroundUrl,
        error: 'Use the workaround URL below to download'
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});