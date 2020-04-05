import express, { Request, Response } from 'express';
import supertest from 'supertest';
import { IBusinessServices, Business, Coordinate } from './business.interface';
import BusinessController from './business';
import { errorHandler } from '../middleware/error.middleware';

test('/businesses create entry', async (done) => {
    const app = express();
    app.use(express.json());

    const service = new MockBusinessService();
    BusinessController(app, service);

    app.use(errorHandler);

    const request = supertest(app);

    const res = await request.post('/businesses').send(validBusinessJSON).set('Content-Type', 'application/json');

    expect(res.status).toBe(201);
    expect(res.text).toBe('Created');
    done();
});

test('/businesses reject invalid entry', async (done) => {
    const app = express();
    app.use(express.json());
    const service = new MockBusinessService();
    BusinessController(app, service);

    app.use(errorHandler);

    const request = supertest(app);

    const res = await request.post('/businesses');
    expect(res.status).toBe(400);
    expect(res.text).toBe('submision is invalid');
    done();
});

test('/businesses failed create entry', async (done) => {
    const app = express();
    app.use(express.json());

    const service = new MockBusinessService();
    BusinessController(app, service);

    app.use(errorHandler);

    const request = supertest(app);

    const badBusinessJSON = Object.assign({}, validBusinessJSON);
    badBusinessJSON.name = 'Business Failed Insert';

    const res = await request.post('/businesses').send(badBusinessJSON).set('Content-Type', 'application/json');
    expect(res.status).toBe(500);
    expect(res.text).toBe('could not write business to db');
    done();
});

test('/businesses get single business', async (done) => {
    const app = express();
    app.use(express.json());

    const service = new MockBusinessService();
    BusinessController(app, service);

    app.use(errorHandler);

    const request = supertest(app);

    const res = await request.get('/businesses/10');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(10);

    done();
});

test('/businesses get non-existant business', async (done) => {
    const app = express();
    app.use(express.json());

    const service = new MockBusinessService();
    BusinessController(app, service);

    app.use(errorHandler);

    const request = supertest(app);

    const res = await request.get('/businesses/1');
    expect(res.status).toBe(404);

    done();
});

test('/businesses get all businesses within lat/lng radius', async (done) => {
    const app = express();
    app.use(express.json());

    const service = new MockBusinessService();
    BusinessController(app, service);

    app.use(errorHandler);

    const request = supertest(app);

    const res = await request.get('/businesses?lat=50.00&lng=50.00');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(20);
    done();
});

test('/businesses get all businesses within zipcode radius', async (done) => {
    const app = express();
    app.use(express.json());

    const service = new MockBusinessService();
    BusinessController(app, service);

    app.use(errorHandler);

    const request = supertest(app);

    const res = await request.get('/businesses?zipcode=49684');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(20);
    done();
});

test('/businesses get all businesses within invalid lat/lng', async (done) => {
    const app = express();
    app.use(express.json());

    const service = new MockBusinessService();
    BusinessController(app, service);

    app.use(errorHandler);

    const request = supertest(app);

    const res = await request.get('/businesses');
    expect(res.status).toBe(400);
    expect(res.text).toBe('invalid lat/lng and zipcode');
    done();
});

test('/businesses failed to fetch businesses', async (done) => {
    const app = express();
    app.use(express.json());

    const service = new MockBusinessService();
    BusinessController(app, service);

    app.use(errorHandler);

    const request = supertest(app);

    const res = await request.get('/businesses?lat=75.00&lng=75.00');
    expect(res.status).toBe(500);
    expect(res.text).toBe('could not get businesses from db');
    done();
});

const validBusinessJSON = {
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
    city: 'Sioux Falls',
    state: 'SD',
    zipcode: '57106',
    donateurl: 'http://duckduckgo.com',
};

const invalidBusinessJSON = {
    badprop: 'lol, what is this?',
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

class MockBusinessService implements IBusinessServices {
    geocodeAddress(street: string, city: string, state: string, zipcode: string): Promise<Coordinate> {
        return new Promise<Coordinate>((resolve, reject) => {
            resolve({
                lat: 50.0,
                lng: 50.0,
            });
        });
    }
    geocodeZipcode(zipcode: string): Promise<Coordinate> {
        return this.geocodeAddress('', '', '', zipcode);
    }
    addBusiness(business: Business): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            if (business.name === 'Business Failed Insert') {
                reject('could not write restaurant to db');
                return;
            }

            resolve(1);
        });
    }
    updateBusiness(business: Business): void {
        throw new Error('Method not implemented.');
    }
    getBusiness(id: number): Promise<Business | null> {
        return new Promise<Business>((resolve, reject) => {
            if (id === exampleBusiness.id) {
                resolve(exampleBusiness);
            } else {
                resolve(undefined);
            }
        });
    }
    getBusinesses(coords: Coordinate): Promise<Business[]> {
        return new Promise<Business[]>((resolve, reject) => {
            if (coords.lat === 75.0) {
                reject('could not get businesses from db');
                return;
            }

            const testBusinesses: Business[] = [];
            for (let i = 0; i < 20; i++) {
                testBusinesses.push(exampleBusiness);
            }

            resolve(testBusinesses);
        });
    }
}
