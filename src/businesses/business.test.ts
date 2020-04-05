import express, { Request, Response } from 'express';
import supertest from 'supertest';
import { IBusinessServices, Business } from './business.interface';
import BusinessController from './business';

test('/businesses create entry', async (done) => {
    const app = express();
    const service = new MockBusinessService();
    BusinessController(app, service);

    const request = supertest(app);

    const res = await request.post('/businesses');
    expect(res.status).toBe(201);
    expect(res.text).toBeFalsy();
    done();
});

test('/businesses reject invalid entry', async (done) => {
    const app = express();
    const service = new MockBusinessService();
    BusinessController(app, service);

    const request = supertest(app);

    const res = await request.post('/businesses');
    expect(res.status).toBe(400);
    expect(res.text).toBe('submision is invalid');
    done();
});

test('/businesses failed create entry', async (done) => {
    const app = express();
    const service = new MockBusinessService();
    BusinessController(app, service);

    const request = supertest(app);

    const res = await request.post('/businesses');
    expect(res.status).toBe(500);
    expect(res.text).toBe('could not write restaurant to db');
    done();
});

const validBusinessJSON = {
    name: "Bob's Burgers",
    type: 'Restaurant',
    tags: ['Diner', 'Burgers'],
    details: 'Testing, 1, 2, 2, 3',
    hours: '10AM - 9PM',
    url: 'http://www.apple.com',
    address: '123 Main Street',
    address_2: 'STE 3',
    city: 'Sioux Falls',
    state: 'SD',
    zipcode: '57106',
    donate_url: 'http://duckduckgo.com',
};

const invalidBusinessJSON = {
    badprop: 'lol, what is this?',
};

class MockBusinessService implements IBusinessServices {
    addBusiness(business: Business): Promise<number> {
        throw new Error('Method not implemented.');
    }
    updateBusiness(business: Business): void {
        throw new Error('Method not implemented.');
    }
    getBusiness(id: number): Promise<Business> {
        throw new Error('Method not implemented.');
    }
    getBusinesses(coords: import('./business.interface').Coordinate): Promise<Business[]> {
        throw new Error('Method not implemented.');
    }
}
