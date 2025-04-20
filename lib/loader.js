const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const logger = require('./logger');

function loadEndpointsFromDirectory(directory, app, baseRoute = '') {
    let endpoints = [];
    const fullPath = path.join(__dirname, '..', directory);
    
    if (!fs.existsSync(fullPath)) {
        logger.warn(`Directory not found: ${fullPath}`);
        return endpoints;
    }
    
    const items = fs.readdirSync(fullPath);
    
    items.forEach(item => {
        const itemPath = path.join(fullPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
            const nestedEndpoints = loadEndpointsFromDirectory(
                path.join(directory, item), 
                app,
                `${baseRoute}/${item}`
            );
            endpoints = [...endpoints, ...nestedEndpoints];
        } else if (stats.isFile() && item.endsWith('.js')) {
            try {
                const module = require(itemPath);
                
                if (module && module.run && typeof module.run === 'function') {
                    const endpointName = item.replace('.js', '');
                    const endpointPath = `${baseRoute}/${endpointName}`;
                    
                    app.all(endpointPath, module.run);
                    
                    let fullPathWithParams = endpointPath;
                    if (module.params && module.params.length > 0) {
                        fullPathWithParams += '?' + module.params.map(param => `${param}=`).join('&');
                    }
                    
                    const category = module.category || 'Other';
                    const categoryIndex = endpoints.findIndex(endpoint => endpoint.name === category);
                    
                    if (categoryIndex === -1) {
                        endpoints.push({
                            name: category,
                            items: []
                        });
                    }
                    
                    const categoryObj = endpoints.find(endpoint => endpoint.name === category);
                    categoryObj.items.push(fullPathWithParams);
                }
            } catch (error) {
                logger.error(`Failed to load module ${item}: ${error.message}`);
            }
        }
    });
    
    return endpoints;
}

module.exports = { loadEndpointsFromDirectory };