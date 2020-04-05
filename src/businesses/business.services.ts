import Knex from 'knex';
import axios from 'axios';
import KnexPostgis from 'knex-postgis';
import { IBusinessServices, Business, Coordinate } from './business.interface';
import { GeocodioResults, Zipcode } from '../admin/admin.interface';

const st = KnexPostgis;

export default class BusinessServices implements IBusinessServices {
    private db: Knex<any, unknown[]>;
    private st: KnexPostgis.KnexPostgis;

    constructor(db: Knex<any, unknown[]>) {
        this.db = db;
        this.st = KnexPostgis(this.db);
    }

    addBusiness(business: Business): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            this.db('businesses')
                .insert({
                    name: business.name,
                    type: business.type,
                    tags: business.tags,
                    phone: business.phone,
                    email: business.email,
                    details: business.details,
                    hours: business.hours,
                    url: business.url,
                    address: business.address,
                    address2: business.address2,
                    city: business.city,
                    state: business.state,
                    zipcode: business.zipcode,
                    location: this.st.point(business.location.lng, business.location.lat),
                    donateurl: business.donateurl,
                    giftcard: business.giftcard,
                    takeout: business.takeout,
                    delivery: business.delivery,
                    closed: business.closed,
                    active: false,
                    created_at: new Date(),
                    updated_at: new Date(),
                })
                .returning('id')
                .then((results) => {
                    resolve(parseInt(results[0], 10));
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    updateBusiness(business: Business): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.db('businesses')
                .update({
                    name: business.name,
                    type: business.type,
                    tags: business.tags,
                    phone: business.phone,
                    email: business.email,
                    details: business.details,
                    hours: business.hours,
                    url: business.url,
                    donateurl: business.donateurl,
                    giftcard: business.giftcard,
                    takeout: business.takeout,
                    delivery: business.delivery,
                    closed: business.closed,
                    active: business.active,
                    updated_at: new Date(),
                    deleted_at: business.deleted_at,
                })
                .then(() => {
                    resolve();
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    getBusiness(id: number): Promise<Business | null> {
        return new Promise<Business>((resolve, reject) => {
            this.db('businesses')
                .select('*', this.st.asText('location'))
                .where({
                    id: id,
                    active: true,
                })
                .then((results) => {
                    const business = results[0] as Business;
                    if (business) {
                        business.location = this.convertPointTextToCoordinate((business.location as unknown) as string);
                        resolve(business);
                    } else {
                        resolve(undefined);
                    }
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    getBusinesses(coords: Coordinate): Promise<Business[]> {
        return new Promise<Business[]>((resolve, reject) => {
            this.db('businesses')
                .select('*', this.st.asText('location'))
                .where({
                    deleted_at: null,
                    active: true,
                })
                .whereRaw(this.st.dwithin('location', this.st.point(coords.lng, coords.lat), 48280.32))
                .orderBy('name', 'asc')
                .then((results) => {
                    const businesses = results.map((business: Business) => {
                        business.location = this.convertPointTextToCoordinate((business.location as unknown) as string);
                        return business;
                    });
                    resolve(businesses);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    geocodeAddress(street: string, city: string, state: string, zipcode: string): Promise<Coordinate> {
        return new Promise<Coordinate>((resolve, reject) => {
            const geocodioUrl = `https://api.geocod.io/v1.4/geocode?street=${street}&city=${city}&state=${state}&postal_code=${zipcode}&api_key=${process.env.GEOCODIO_APIKEY}`;
            axios
                .get(geocodioUrl)
                .then((response) => {
                    const geocodioResults = response.data as GeocodioResults;
                    if (geocodioResults.results.length > 0) {
                        const coord: Coordinate = {
                            lat: geocodioResults.results[0].location.lat,
                            lng: geocodioResults.results[0].location.lng,
                        };

                        resolve(coord);
                    } else {
                        reject(new Error('no geocoder results'));
                    }
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    geocodeZipcode(zipcode: string): Promise<Coordinate> {
        return new Promise<Coordinate>((resolve, reject) => {
            this.lookupZipcode(zipcode)
                .then((coord) => {
                    if (coord) {
                        resolve(coord);
                        return;
                    }
                    console.log('geocoding zipcode', zipcode);
                    this.geocodeAddress('', '', '', zipcode)
                        .then((geocoded_coord) => {
                            resolve(geocoded_coord);
                        })
                        .then((err) => {
                            reject(err);
                        });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    lookupZipcode(zipcode: string): Promise<Coordinate | null> {
        return new Promise<Coordinate>((resolve, reject) => {
            this.db('zipcodes')
                .select('*')
                .where('zipcode', zipcode)
                .then((results) => {
                    if (results[0]) {
                        resolve({
                            lat: results[0].lat,
                            lng: results[0].lng,
                        });
                    } else {
                        resolve(undefined);
                    }
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    convertPointTextToCoordinate(pointTxt: string): Coordinate {
        const trimmed = pointTxt.replace('POINT(', '').replace(')', '');
        const values = trimmed.split(' ');

        return {
            lat: parseFloat(values[1]),
            lng: parseFloat(values[0]),
        };
    }
}
