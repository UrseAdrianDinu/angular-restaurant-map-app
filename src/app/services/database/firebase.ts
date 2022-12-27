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


}
