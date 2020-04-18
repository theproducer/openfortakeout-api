import Knex from 'knex';
import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { IAdminServices } from './admin.interface';
import { Business } from '../businesses/business.interface';
import HttpException from '../common/http-exception';

export default class AdminServices implements IAdminServices {
    private db: Knex<any, unknown[]>;

    constructor(db: Knex<any, unknown[]>) {
        this.db = db;

        admin.initializeApp({
            credential: admin.credential.cert(process.env.FIREBASE_KEY as string),
        });
    }

    authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.headers['authorization-token'] as string;
            if (!token) {
                throw new Error('authorization token required');
            }
            const decodedToken = await admin.auth().verifyIdToken(token, true);

            const isValidUser = await this.verifyAdminUser(decodedToken.uid);
            if (!isValidUser) {
                throw new Error('user is not authorized.');
            }
        } catch (err) {
            next(new HttpException(401, err, err));
            return;
        }

        next();
    };

    verifyAdminUser = (uid: string): Promise<boolean> => {
        return new Promise<boolean>((resolve, reject) => {
            this.db('admins')
                .select('*')
                .where({
                    fbuid: uid,
                })
                .then((results) => {
                    if (results.length > 0) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                })
                .catch((err) => {
                    reject(err);
                });
        });
    };
    getAllBusinesses = (): Promise<Business[]> => {
        return new Promise<Business[]>((resolve, reject) => {
            this.db('businesses')
                .select('*')
                .orderBy('id', 'asc')
                .then((results) => {
                    resolve(results as Business[]);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    };

    approveBusiness = (id: number): Promise<Business> => {
        throw new Error('Method not implemented.');
    };
}
