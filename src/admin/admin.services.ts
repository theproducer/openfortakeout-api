import Knex from 'knex';
import { IAdminServices } from './admin.interface';
import { Business } from '../businesses/business.interface';

export default class AdminServices implements IAdminServices {
    private db: Knex<any, unknown[]>;

    constructor(db: Knex<any, unknown[]>) {
        this.db = db;
    }

    approveBusiness(id: number): Promise<Business> {
        throw new Error('Method not implemented.');
    }
}
