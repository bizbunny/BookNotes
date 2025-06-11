//use environment variables to configure
/*
Dotenv is library that allows you to manage environment variables by storing them 
in separate .env file and loading them into your app's runtime environment. 
This helps in keeping sensitive information like API keys and database credentials 
outside of your codebase, enhancing security and flexibility.
*/
require('dotenv').config();

module.exports = {
    database: {
        file: process.env.DB_FILE || './data/table.db',
        timeout: parseInt(process.env.DB_TIMEOUT) || 5000
    },
    server: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
    },
    cache: {
        ttl: parseInt(process.env.CACHE_TTL) || 3600
    }
};