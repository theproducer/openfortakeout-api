import express, { Request, Response, Express, NextFunction } from 'express';
import validatejs from 'validate.js';
import { IAdminServices } from './admin.interface';
import { Business, BusinessValidator, IBusinessServices } from '../businesses/business.interface';
import HttpException from '../common/http-exception';

export default function AdminController(app: Express, service: IAdminServices, businessService: IBusinessServices) {
    const router = express.Router();

    app.use('/admin', router);
    router.use(service.authMiddleware);
    router.get('/', getAllBusinesses);
    router.put('/', updateBusiness);

    async function getAllBusinesses(req: Request, res: Response, next: NextFunction) {
        try {
            const businesses = await service.getAllBusinesses();
            res.status(200).send({
                businesses: businesses,
            });
        } catch (err) {
            next(new HttpException(500, err.message, err));
        }
    }

    async function updateBusiness(req: Request, res: Response, next: NextFunction) {
        const business = req.body as Business;
        const validationErrors = validatejs(business, BusinessValidator);

        if (validationErrors !== undefined) {
            console.log(validationErrors);
            next(new HttpException(400, 'submision is invalid', 'submissions is invalid'));
            return;
        }

        try {
            const oldBusiness = await businessService.getBusiness(business.id as number, true);
            if (oldBusiness) {
                if (
                    oldBusiness.address !== business.address ||
                    oldBusiness.address2 !== business.address2 ||
                    oldBusiness.city !== business.city ||
                    oldBusiness.state !== business.state ||
                    oldBusiness.zipcode !== business.zipcode
                ) {
                    const coordinate = await businessService.geocodeAddress(
                        business.address + ' ' + business.address2,
                        business.city,
                        business.state,
                        business.zipcode,
                    );

                    business.location = coordinate;
                }

                await businessService.updateBusiness(business);
                res.sendStatus(200);
            } else {
                res.sendStatus(404);
            }
        } catch (err) {
            next(new HttpException(500, err.message, err));
        }
    }
}
