(async () => {
    global.logger = require('./lib/logger');
    const express = require('express');
    const path = require('path');
    const chalk = require('chalk');
    const fs = require('node:fs');
    const PORT = process.env.PORT || 4000
    
    const app = express();
    
    app.set('trust proxy', true);
    app.set('json spaces', 2);
    
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(require('./lib/logApiRequest'));
    
    app.use((req, res, next) => {
        const originalJson = res.json;
        res.json = function (data) {
            if (data && typeof data === 'object') {
                const statusCode = res.statusCode || 200;
                
                const responseData = {
                    statusCode: statusCode,
                    creator: '@Nasirxml',
                    ...data
                };
                
                return originalJson.call(this, responseData);
            }
            return originalJson.call(this, data);
        };
        next();
    });
    
    logger.info('Starting server initialization...');
    
    logger.info('Loading API endpoints...');
    const allEndpoints = require('./lib/loader').loadEndpointsFromDirectory('api', app);
    console.log('');
    logger.ready(`Loaded ${allEndpoints.reduce((total, category) => total + category.items.length, 0)} endpoints`);
    
    app.get('/', async (req, res) => {
        res.status(200).json({
            endpoints: allEndpoints
        });
    });
    
    app.use((req, res, next) => {
        logger.info(`404: ${req.method} ${req.path}`);
        res.status(404).json({
            error: 'Huh??'
        })
    });
    
    app.use((err, req, res, next) => {
        logger.error(`500: ${err.message}`);
        res.status(500).json({
            error: 'Huh??'
        })
    });
    
    app.listen(PORT, () => {
        console.log('');
        logger.ready(`Server started successfully`);
        logger.info(`Local:   ${chalk.cyan(`http://localhost:${PORT}`)}`);
        
        try {
            const { networkInterfaces } = require('os');
            const nets = networkInterfaces();
            const results = {};
            
            for (const name of Object.keys(nets)) {
                for (const net of nets[name]) {
                    if (net.family === 'IPv4' && !net.internal) {
                        if (!results[name]) {
                            results[name] = [];
                        }
                        results[name].push(net.address);
                    }
                }
            }
            
            for (const [, addresses] of Object.entries(results)) {
                for (const addr of addresses) {
                    logger.info(`Network: ${chalk.cyan(`http://${addr}:${PORT}`)}`);
                }
            }
        } catch (error) {
            logger.warn(`Cannot detect network interfaces: ${error.message}`);
        }
        
        logger.info(`${chalk.dim('Ready for connections')}`);
        console.log('');
    });
    
    module.exports = app;
})();
