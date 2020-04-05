import * as knex from 'knex';
import * as dotenv from 'dotenv';

dotenv.config();

const database = {
    client: 'pg',
    connection: {
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        debug: true,
    },
    debug: true,
    migrations: {
        tableName: 'knex_migrations',
    },
} as knex.Config;

export = database;
