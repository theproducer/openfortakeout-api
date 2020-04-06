import { Coordinate, Business } from '../businesses/business.interface';

export interface IAdminServices {
    approveBusiness(id: number): Promise<Business>;
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

// https://api.wereopenfortakeout.com/slackadmin/webhook/
