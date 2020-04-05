import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import Knex from 'knex';
import * as database from '../knexfile';

import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';

import BusinessController from './businesses/business';
import BusinessService from './businesses/business.services';

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

const db = Knex(database);

(async () => {
    await db.migrate.latest();
    const port: number = parseInt(process.env.PORT as string, 10);

    const app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json());

    // Mount controllers here
    const businessService = new BusinessService(db);
    BusinessController(app, businessService);

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
