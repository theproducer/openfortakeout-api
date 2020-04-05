import express, { Request, Response, Express } from 'express';
import { IBusinessServices } from './business.interface';

export default function BusinessController(app: Express, service: IBusinessServices) {
    const router = express.Router();

    app.use('/businesses', router);
    router.get('/', getBusinesses);
    router.post('/', addBusiness);
    router.get('/:id', getBusiness);

    function getBusinesses(req: Request, res: Response) {
        res.sendStatus(405);
    }

    function getBusiness(req: Request, res: Response) {
        res.sendStatus(405);
    }

    function addBusiness(req: Request, res: Response) {
        res.sendStatus(405);
    }
}
