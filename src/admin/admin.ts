import express, { Request, Response, Express } from 'express';
import { IAdminServices } from './admin.interface';

export default function AdminController(app: Express, service: IAdminServices) {
    const router = express.Router();

    app.use('/admin', router);
}
