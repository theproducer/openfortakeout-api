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
    },
    migrations: {
        tableName: 'knex_migrations',
        directory: process.env.MIGRATIONS,
    },
} as knex.Config;

export = database;
