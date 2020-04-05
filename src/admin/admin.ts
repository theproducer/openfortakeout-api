import express, { Request, Response, Express } from 'express';
import {} from './admin.interface';

export default function AdminController(app: Express) {
    const router = express.Router();

    app.use('/admin', router);
    router.post('/slackwebhook', processSlackWebhook);

    function processSlackWebhook(req: Request, res: Response) {}
}
