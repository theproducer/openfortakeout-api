module.exports = {
    apps: [
        {
            name: 'openfortakeout-api',
            script: './dist/index.js',
            env: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
            },
        },
    ],
};
