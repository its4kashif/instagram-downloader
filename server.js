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

    try {
        // Use fastdl's working API (they have residential proxies)
        const fastDlApi = `https://fastdl.app/api/instagram?url=${encodeURIComponent(url)}`;
        
        const response = await axios.get(fastDlApi, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                'Origin': 'https://fastdl.app',
                'Referer': 'https://fastdl.app/en2'
            },
            timeout: 15000
        });
        
        if (response.data && (response.data.video_url || response.data.url)) {
            const videoUrl = response.data.video_url || response.data.url;
            return res.json({
                success: true,
                videoUrl: videoUrl,
                title: response.data.title || 'instagram_video'
            });
        } else {
            throw new Error('No video URL returned');
        }
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ 
            error: 'Unable to fetch video. Instagram blocks datacenter IPs. Try using f-d.app/ before your Instagram URL as a workaround.'
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});