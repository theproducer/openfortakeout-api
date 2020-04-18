import express, { Request, Response, Express, NextFunction } from 'express';
import * as _ from 'lodash';
import validatejs from 'validate.js';
import HttpException from '../common/http-exception';

import { IBusinessServices, Business, BusinessValidator, Coordinate, Correction } from './business.interface';

export default function BusinessController(app: Express, service: IBusinessServices) {
    const router = express.Router();

    app.use('/businesses', router);
    router.get('/', getBusinesses);
    router.post('/', addBusiness);
    router.get('/:id', getBusiness);
    router.post('/:id/correction', addCorrection);

    async function getBusinesses(req: Request, res: Response, next: NextFunction) {
        try {
            let lat = parseFloat(req.query.lat as string);
            let lng = parseFloat(req.query.lng as string);
            if (isNaN(lat)) {
                lat = 0;
            }

            if (isNaN(lng)) {
                lng = 0;
            }
            const zipcode = (req.query.zipcode as string) || '';
            if (lat === 0 && lng === 0) {
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
            let alltags: string[] = [];
            businesses.forEach((business) => {
                const tags = business.tags;
                if (tags && tags.length > 0) {
                    for (let i = 0; i < tags.length; i++) {
                        const tag = tags[i];
                        if (tag) {
                            alltags.push(tag.toLowerCase());
                        }
                    }
                }
            });

            alltags = _.uniq(alltags);

            res.status(200).send({
                businesses: businesses,
                tags: alltags,
            });
        } catch (err) {
            next(new HttpException(500, err, err));
        }
    }

    async function getBusiness(req: Request, res: Response, next: NextFunction) {
        const entryId = parseInt(req.params.id, 10);
        const business = await service.getBusiness(entryId, false);

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
            console.log(validationErrors);
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

    async function addCorrection(req: Request, res: Response, next: NextFunction) {
        const entryId = parseInt(req.params.id, 10);
        const business = await service.getBusiness(entryId, false);

        if (!business) {
            res.sendStatus(404);
        } else {
            const newCorrection = req.body as Correction;
            newCorrection.business_id = business.id as number;

            if (!newCorrection.business_id) {
                next(new HttpException(400, 'correction must have an associated business'));
                return;
            }

            try {
                const entryId = await service.addCorrection(newCorrection, business);
                res.sendStatus(201);
            } catch (err) {
                next(new HttpException(500, 'could not write correction to db', err));
            }
        }
    }
}
