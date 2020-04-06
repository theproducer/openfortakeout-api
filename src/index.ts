import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import Knex from 'knex';
import * as Sentry from '@sentry/node';
import * as winston from 'winston';
import * as expressWinston from 'express-winston';
import * as database from '../knexfile';

import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';

import SlackController from './slack/slack';

import BusinessController from './businesses/business';
import BusinessService from './businesses/business.services';

import AdminController from './admin/admin';
import AdminService from './admin/admin.services';

type ModuleId = string | number;

interface WebpackHotModule {
    hot?: {
        data: any;
        accept(dependencies: string[], callback?: (updatedDependencies: ModuleId[]) => void): void;
        accept(dependency: string, callback?: () => void): void;
        accept(errHandler?: (err: Error) => void): void;
        dispose(callback: (data: any) => void): void;
    };
}

declare const module: WebpackHotModule;

dotenv.config();
Sentry.init({ dsn: process.env.SENTRY_DSN });

const db = Knex(database);
const businessService = new BusinessService(db);
const adminService = new AdminService(db);

(async () => {
    await db.migrate.latest();
    const port: number = parseInt(process.env.PORT as string, 10);

    const app = express();
    SlackController(app, businessService);
    app.use(Sentry.Handlers.requestHandler());
    app.use(helmet());
    app.use(
        cors({
            origin: process.env.ORIGIN?.split(','),
        }),
    );
    app.use(express.json());
    app.use(
        expressWinston.logger({
            transports: [new winston.transports.Console()],
            format: winston.format.combine(winston.format.colorize(), winston.format.json()),
            expressFormat: true,
            colorize: true,
        }),
    );

    // Mount controllers here
    BusinessController(app, businessService);
    AdminController(app, adminService);

    app.use(Sentry.Handlers.errorHandler());
    app.use(errorHandler);
    app.use(notFoundHandler);

    const server = app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });

    if (process.env.APP_ENV !== 'production') {
        if (module.hot) {
            module.hot.accept();
            module.hot.dispose(() => server.close());
        }
    }
})();
