import express, { Request, Response, NextFunction } from 'express';
import supertest from 'supertest';

import { IBusinessServices, Business, Correction, Coordinate } from '../businesses/business.interface';
import { IAdminServices } from './admin.interface';
import AdminController from './admin';

import { errorHandler } from '../middleware/error.middleware';

test('/admin get all entries', async (done) => {
    const app = express();
    app.use(express.json());

    const adminService = new MockAdminService();
    const businessService = new MockBusinessService();

    AdminController(app, adminService, businessService);

    app.use(errorHandler);

    const request = supertest(app);

    const res = await request
        .get('/admin')
        .set('Content-Type', 'application/json')
        .set('Authorizaton-Token', 'validtoken');

    expect(res.status).toBe(200);
    expect(res.body.businesses).toHaveLength(20);

    done();
});

test('/admin updated entry', async (done) => {
    const app = express();
    app.use(express.json());

    const adminService = new MockAdminService();
    const businessService = new MockBusinessService();

    AdminController(app, adminService, businessService);

    app.use(errorHandler);

    const request = supertest(app);

    const res = await request
        .put('/admin')
        .send(validBusinessJSON)
        .set('Content-Type', 'application/json')
        .set('Authorizaton-Token', 'validtoken');

    expect(res.status).toBe(200);

    done();
});

test('/admin fail to update entry with invalid submission', async (done) => {
    const app = express();
    app.use(express.json());

    const adminService = new MockAdminService();
    const businessService = new MockBusinessService();

    AdminController(app, adminService, businessService);

    app.use(errorHandler);

    const request = supertest(app);

    const res = await request
        .put('/admin')
        .send(invalidBusinessJSON)
        .set('Content-Type', 'application/json')
        .set('Authorizaton-Token', 'validtoken');

    expect(res.status).toBe(400);

    done();
});

test('/admin fail to update entry a non-existant entry', async (done) => {
    const app = express();
    app.use(express.json());

    const adminService = new MockAdminService();
    const businessService = new MockBusinessService();

    AdminController(app, adminService, businessService);

    app.use(errorHandler);

    const request = supertest(app);

    const res = await request
        .put('/admin')
        .send(nonExistantBusinessJSON)
        .set('Content-Type', 'application/json')
        .set('Authorizaton-Token', 'validtoken');

    expect(res.status).toBe(404);

    done();
});

const validBusinessJSON = {
    id: 10,
    name: "Bob's Burgers",
    type: 'Restaurant',
    phone: '605-444-9999',
    email: 'jdoe@example.net',
    tags: ['Diner', 'Burgers'],
    details: 'Testing, 1, 2, 2, 3',
    hours: '10AM - 9PM',
    url: 'http://www.apple.com',
    address: '123 Main Street',
    address2: 'STE 3',
    city: 'Harrisburg',
    state: 'SD',
    zipcode: '57106',
    donateurl: 'http://duckduckgo.com',
};

const invalidBusinessJSON = {
    id: 10,
    name: null,
    type: 'Restaurant',
    phone: '605-444-9999',
    email: 'jdoe@example.net',
    tags: ['Diner', 'Burgers'],
    details: 'Testing, 1, 2, 2, 3',
    hours: '10AM - 9PM',
    url: 'http://www.apple.com',
    address: '123 Main Street',
    address2: 'STE 3',
    city: 'Sioux Falls',
    state: 'SD',
    zipcode: '57106',
    donateurl: 'http://duckduckgo.com',
};

const nonExistantBusinessJSON = {
    id: 11,
    name: 'This does not exist',
    type: 'Restaurant',
    phone: '605-444-9999',
    email: 'jdoe@example.net',
    tags: ['Diner', 'Burgers'],
    details: 'Testing, 1, 2, 2, 3',
    hours: '10AM - 9PM',
    url: 'http://www.apple.com',
    address: '123 Main Street',
    address2: 'STE 3',
    city: 'Sioux Falls',
    state: 'SD',
    zipcode: '57106',
    donateurl: 'http://duckduckgo.com',
};

const exampleBusiness: Business = {
    id: 10,
    name: 'McDonalds',
    type: 'Restaurant',
    phone: '605-444-9999',
    email: 'jdoe@example.net',
    tags: ['Diner', 'Burgers'],
    details: 'Testing, 1, 2, 2, 3',
    hours: '10AM - 9PM',
    url: 'http://www.apple.com',
    address: '123 Main Street',
    address2: 'STE 3',
    city: 'Sioux Falls',
    state: 'SD',
    zipcode: '57106',
    location: { lat: 50.0, lng: 50.0 },
    donateurl: 'http://duckduckgo.com',
    giftcard: true,
    takeout: true,
    delivery: false,
    closed: false,
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: undefined,
};

class MockAdminService implements IAdminServices {
    authMiddleware(req: Request, res: Response, next: NextFunction) {
        const token = req.headers['authorization-token'] as string;
        switch (token) {
            default:
                next();
                break;
        }
    }
    approveBusiness(id: number): Promise<Business> {
        throw new Error('Method not implemented.');
    }
    getAllBusinesses(): Promise<Business[]> {
        return new Promise<Business[]>((resolve, reject) => {
            const testBusinesses: Business[] = [];
            for (let i = 0; i < 20; i++) {
                testBusinesses.push(exampleBusiness);
            }

            resolve(testBusinesses);
        });
    }
    verifyAdminUser(uid: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
}

class MockBusinessService implements IBusinessServices {
    addBusiness(business: Business): Promise<number> {
        throw new Error('Method not implemented.');
    }
    addCorrection(correction: Correction, business: Business): Promise<number> {
        throw new Error('Method not implemented.');
    }
    updateCorrection(correction: Correction): Promise<void> {
        throw new Error('Method not implemented.');
    }
    getCorrection(id: number): Promise<Correction | null> {
        throw new Error('Method not implemented.');
    }
    updateBusiness(business: Business): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (business.name === "Bob's Burgers") {
                resolve();
            } else {
                reject('nothing to update');
            }
        });
    }
    getBusiness(id: number, returnInactive: boolean): Promise<Business | null> {
        return new Promise<Business | null>((resolve, reject) => {
            switch (id) {
                case 10:
                    resolve(exampleBusiness);
                    break;
                case 11:
                    resolve(null);
                    break;
                default:
                    reject('nothing to return');
                    break;
            }
        });
    }
    getBusinesses(coords: Coordinate): Promise<Business[]> {
        throw new Error('Method not implemented.');
    }
    geocodeAddress(street: string, city: string, state: string, zipcode: string): Promise<Coordinate> {
        return new Promise<Coordinate>((resolve, reject) => {
            switch (city) {
                case 'Harrisburg': {
                    const coord: Coordinate = {
                        lat: 25.0,
                        lng: 36.0,
                    };

                    resolve(coord);
                    break;
                }

                case 'Sioux Falls': {
                    const coord: Coordinate = {
                        lat: 25.0,
                        lng: 36.0,
                    };

                    resolve(coord);
                    break;
                }

                default:
                    reject('no valid coords');
                    break;
            }
        });
    }
    geocodeZipcode(zipcode: string): Promise<Coordinate> {
        throw new Error('Method not implemented.');
    }
}
