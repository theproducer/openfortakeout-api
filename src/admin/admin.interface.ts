import { Request, Response, NextFunction } from 'express';

import { Coordinate, Business } from '../businesses/business.interface';

export interface IAdminServices {
    approveBusiness(id: number): Promise<Business>;
    getAllBusinesses(): Promise<Business[]>;
    verifyAdminUser(uid: string): Promise<boolean>;
    authMiddleware(req: Request, res: Response, next: NextFunction): void;
}

export interface GeocodioResults {
    results: GeocodioResult[];
}

export interface GeocodioResult {
    location: Coordinate;
}

export interface Zipcode {
    id: number;
    zipcode: string;
    lat: number;
    lng: number;
}
