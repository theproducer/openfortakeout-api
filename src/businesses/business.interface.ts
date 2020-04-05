export interface IBusinessServices {
    addBusiness(business: Business): Promise<number>;
    updateBusiness(business: Business): void;
    getBusiness(id: number): Promise<Business>;
    getBusinesses(coords: Coordinate): Promise<Business[]>;
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
    details: string;
    hours: string;
    email: string;
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
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
}
