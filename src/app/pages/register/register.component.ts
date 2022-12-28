import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService, IUser } from "src/app/services/database/firebase";
import {firstValueFrom, lastValueFrom} from "rxjs";

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  password: any;
  email: any;
  firstName: any;
  lastName: any;
  phone: any;
  username: any;
  emptyFields = false;
  submitted = false;
  validMail = true;
  validPass = true;
  usernameExists = false;

  constructor(private router: Router,
              private fbs: FirebaseService
  ) { }

  ngOnInit(): void {
  }

  validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(
            /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
        );
  };

   async onSubmit() {
     this.submitted = true;


     if (!this.email || !this.firstName || !this.lastName || !this.firstName || !this.phone || !this.username || !this.password) {
       this.emptyFields = true;

     } else {
       this.emptyFields = false;
       let user = await firstValueFrom(this.fbs.getUser(this.username).valueChanges());
       if (user)
       {
         this.usernameExists = true;
       }
       else {
         this.usernameExists = false;
         if (!this.validateEmail(this.email)) {
             this.validMail = false;
         }
         else {
           this.validMail = true;
           if(this.password.length < 8)
             this.validPass = false;
           else{
             this.validPass = true;
             this.fbs.addUser(this.email, this.firstName, this.lastName, this.phone, this.username, this.password);
             this.goHome();
           }
         }
       }
     }
   }

  goHome() {
    this.router.navigate(['/home']);
  }
}
