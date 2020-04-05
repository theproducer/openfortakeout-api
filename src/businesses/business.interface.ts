import validatejs from 'validate.js';

export interface IBusinessServices {
    addBusiness(business: Business): Promise<number>;
    updateBusiness(business: Business): Promise<void>;
    getBusiness(id: number): Promise<Business | null>;
    getBusinesses(coords: Coordinate): Promise<Business[]>;
    geocodeAddress(street: string, city: string, state: string, zipcode: string): Promise<Coordinate>;
    geocodeZipcode(zipcode: string): Promise<Coordinate>;
}

export interface Coordinate {
    lat: number;
    lng: number;
}

export interface Business {
    id?: number;
    name: string;
    type: string;
    tags: string[];
    phone: string;
    email: string;
    details: string;
    hours: string;
    url: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    zipcode: string;
    location: Coordinate;
    donateurl: string;
    giftcard: boolean;
    takeout: boolean;
    delivery: boolean;
    closed: boolean;
    active: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
}

export const BusinessValidator = {
    name: { presence: true },
    type: { presence: true },
    phone: {
        presence: true,
        length: {
            minimum: 10,
            maximum: 14,
        },
    },
    email: {
        presence: true,
        email: true,
    },
    url: { url: true },
    address: { presence: true },
    city: { presence: true },
    state: { presence: true },
    zipcode: {
        presence: true,
        length: { is: 5 },
    },
    donateurl: { url: true },
    giftcard: { type: 'boolean' },
    takeout: { type: 'boolean' },
    delivery: { type: 'boolean' },
    closed: { type: 'boolean' },
};
