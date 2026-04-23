const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main API endpoint to download Instagram video
app.post('/api/download', async (req, res) => {
    const { url } = req.body;
    
    // Validate URL
    if (!url) {
        return res.status(400).json({ error: 'Please provide an Instagram URL' });
    }
    
    if (!url.includes('instagram.com')) {
        return res.status(400).json({ error: 'Please enter a valid Instagram URL (instagram.com/reel/..., /p/..., or /tv/...)' });
    }
    
    // Reject Stories (not supported)
    if (url.includes('/stories/')) {
        return res.status(400).json({ error: 'Instagram Stories are not supported. Please use Reels, video posts, or IGTV.' });
    }

    try {
        console.log(`Processing Instagram URL: ${url}`);
        
        // Using multiple public APIs with fallback for reliability
        
        // API 1: FastDL (works well for Reels and posts)
        const fastDlApi = `https://fastdl.app/api/instagram?url=${encodeURIComponent(url)}`;
        
        try {
            const response = await axios.get(fastDlApi, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                },
                timeout: 10000
            });
            
            if (response.data && (response.data.video_url || response.data.url)) {
                const videoUrl = response.data.video_url || response.data.url;
                console.log('Video found via FastDL API');
                return res.json({
                    success: true,
                    videoUrl: videoUrl,
                    title: response.data.title || 'instagram_video'
                });
            }
        } catch (fastDlError) {
            console.log('FastDL API failed, trying fallback...');
        }
        
        // API 2: Alternative public endpoint
        const altApi = `https://instagram-video-downloader.vercel.app/api?url=${encodeURIComponent(url)}`;
        
        try {
            const altResponse = await axios.get(altApi, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 10000
            });
            
            if (altResponse.data && (altResponse.data.video || altResponse.data.video_url)) {
                const videoUrl = altResponse.data.video || altResponse.data.video_url;
                console.log('Video found via alternative API');
                return res.json({
                    success: true,
                    videoUrl: videoUrl,
                    title: altResponse.data.title || 'instagram_video'
                });
            }
        } catch (altError) {
            console.log('Alternative API failed');
        }
        
        // API 3: Instagram video downloader API (community maintained)
        const communityApi = `https://insta-api.vercel.app/api/instagram?url=${encodeURIComponent(url)}`;
        
        try {
            const communityResponse = await axios.get(communityApi, {
                timeout: 10000
            });
            
            if (communityResponse.data && communityResponse.data.video_url) {
                console.log('Video found via community API');
                return res.json({
                    success: true,
                    videoUrl: communityResponse.data.video_url,
                    title: communityResponse.data.title || 'instagram_video'
                });
            }
        } catch (communityError) {
            console.log('Community API failed');
        }
        
        // If all APIs fail
        throw new Error('Unable to extract video from this Instagram link. Make sure the post contains a video and is public.');
        
    } catch (error) {
        console.error('Error details:', error.message);
        
        // Provide helpful error message
        let errorMessage = 'Failed to fetch video. ';
        
        if (error.message.includes('timeout')) {
            errorMessage += 'Request timed out. Please try again.';
        } else if (error.message.includes('404')) {
            errorMessage += 'Video not found. The link might be broken or the video was deleted.';
        } else if (error.message.includes('429')) {
            errorMessage += 'Too many requests. Please wait a moment and try again.';
        } else {
            errorMessage += 'Make sure the link is from a PUBLIC Instagram Reel or video post. Private accounts are not supported.';
        }
        
        res.status(500).json({ 
            error: errorMessage,
            details: error.message 
        });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle 404 for unknown routes
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found. Use POST /api/download with an Instagram URL.' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Instagram Downloader server running on port ${PORT}`);
    console.log(`📍 Open http://localhost:${PORT} in your browser`);
});