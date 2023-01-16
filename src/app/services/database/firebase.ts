import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';

export interface IUser {
    email: string,
    firstName: string,
    lastName: string,
    phone: string,
    username: string,
    password: string
}

export interface IRestaurant {
    city: string,
    country: string,
    phone: string,
    placeName: string,
    placeAddr: string,
    postal: string,
    region:string,
    url:string,
}

@Injectable()
export class FirebaseService {

    listFeed: Observable<any[]>;
    objFeed: Observable<any>;

    constructor(public db: AngularFireDatabase) {

    }

    connectToDatabase() {
        this.listFeed = this.db.list('list').valueChanges();
        this.objFeed = this.db.object('obj').valueChanges();
    }

    getChangeFeedList() {
        return this.listFeed;
    }

    getChangeFeedObj() {
        return this.objFeed;
    }
    //
    // addPointItem(lat: number, lng: number) {
    //     let item: ITestItem = {
    //         name: "test",
    //         lat: lat,
    //         lng: lng
    //     };
    //     this.db.list('list').push(item);
    // }

    // syncPointItem(lat: number, lng: number) {
    //     let item: ITestItem = {
    //         name: "test",
    //         lat: lat,
    //         lng: lng
    //     };
    //     this.db.object('obj').set([item]);
    // }
    addUser( email: string,
             firstName: string,
             lastName: string,
             phone: string,
             username: string,
             password: string) {
        let user: IUser = {
            email: email,
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            username: username,
            password: password,
        };
        this.db.database.ref('users/' + username).set(user).then(r => console.log("User added!"));
    }

    getUser(username:string) {
        //this.db.database.ref('users/' + username).
        return this.db.object('users/' + username);
    }

    addRestaurant( city: string,
                   country: string,
                   phone: string,
                   placeName: string,
                   placeAddr: string,
                   postal: string,
                   region:string,
                   url:string) {
        let restaurant: IRestaurant = {
            city: city,
            country: country,
            phone: phone,
            placeName: placeName,
            placeAddr: placeAddr,
            postal: postal,
            region:region,
            url:url
        };
        let key = placeName.replace(/\s/g, "");
        this.db.database.ref('restaurants/' + key).set(restaurant).then(r => console.log("Restaurant added!"));
    }

}
