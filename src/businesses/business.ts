import express, { Request, Response, Express, NextFunction } from 'express';
import validatejs from 'validate.js';
import HttpException from '../common/http-exception';

import { IBusinessServices, Business, BusinessValidator, Coordinate } from './business.interface';

export default function BusinessController(app: Express, service: IBusinessServices) {
    const router = express.Router();

    app.use('/businesses', router);
    router.get('/', getBusinesses);
    router.post('/', addBusiness);
    router.get('/:id', getBusiness);

    async function getBusinesses(req: Request, res: Response, next: NextFunction) {
        try {
            let lat = parseFloat(req.query.lat || 0.0);
            let lng = parseFloat(req.query.lng || 0.0);
            const zipcode = req.query.zipcode || '';

            if (lat === 0.0 && lng === 0.0) {
                if (zipcode === '') {
                    next(new HttpException(400, 'invalid lat/lng and zipcode'));
                    return;
                }

                const coords = await service.geocodeZipcode(zipcode);
                lat = coords.lat;
                lng = coords.lng;
            }

            const coordinate: Coordinate = {
                lat: lat,
                lng: lng,
            };

            const businesses = await service.getBusinesses(coordinate);
            res.status(200).send(businesses);
        } catch (err) {
            next(new HttpException(500, err, err));
        }
    }

    async function getBusiness(req: Request, res: Response, next: NextFunction) {
        const entryId = parseInt(req.params.id, 10);
        console.log(entryId);
        const business = await service.getBusiness(entryId);

        if (!business) {
            res.sendStatus(404);
        } else {
            res.status(200).send(business);
        }
    }

    async function addBusiness(req: Request, res: Response, next: NextFunction) {
        const newBusiness = req.body as Business;
        const validationErrors = validatejs(newBusiness, BusinessValidator);

        if (validationErrors !== undefined) {
            next(new HttpException(400, 'submision is invalid'));
            return;
        }

        try {
            const coordinate = await service.geocodeAddress(
                newBusiness.address + ' ' + newBusiness.address2,
                newBusiness.city,
                newBusiness.state,
                newBusiness.zipcode,
            );

            newBusiness.location = coordinate;

            const entryId = await service.addBusiness(newBusiness);
            res.sendStatus(201);
        } catch (err) {
            next(new HttpException(500, 'could not write business to db', err));
        }
    }
}
