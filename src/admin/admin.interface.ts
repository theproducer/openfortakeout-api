import { Coordinate } from '../businesses/business.interface';

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
