import validatejs from 'validate.js';

validatejs.validators.urlAllowBlank = function (value: any, options: any, attribute: any, attributes: any) {
    if (validatejs.isEmpty(value)) {
        return;
    }
    return validatejs.validators.url(value, options, attribute, attributes);
};

export interface IBusinessServices {
    addBusiness(business: Business): Promise<number>;
    addCorrection(correction: Correction, business: Business): Promise<number>;
    updateCorrection(correction: Correction): Promise<void>;
    getCorrection(id: number): Promise<Correction | null>;
    updateBusiness(business: Business): Promise<void>;
    getBusiness(id: number, returnInactive: boolean): Promise<Business | null>;
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

export interface Correction {
    id?: number;
    business_id: number;
    type: string;
    tags: string[];
    phone: string;
    details: string;
    hours: string;
    url: string;
    donateurl: string;
    giftcard: boolean;
    takeout: boolean;
    delivery: boolean;
    closed: boolean;
    approved: boolean;
    notes: string;
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
    donateurl: { urlAllowBlank: true, presence: { allowEmpty: true } },
    giftcard: { type: 'boolean' },
    takeout: { type: 'boolean' },
    delivery: { type: 'boolean' },
    closed: { type: 'boolean' },
};
