const axios = require('axios');

module.exports = {
    category: 'Downloader',
    params: ['url'],
    async run(req, res) {
        const { url } = req.query;
        
        // Validate the URL
        if (!url) return res.status(400).json({ error: 'Url is required' });
        
        try {
            const response = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${url}`);
            
            // Send the result from the response
            res.status(200).json({
                result: response.data // Correctly reference the response data
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
