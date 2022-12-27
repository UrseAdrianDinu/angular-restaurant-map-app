import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService, IUser } from "src/app/services/database/firebase";

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

  constructor(private router: Router,
              private fbs: FirebaseService
  ) { }

  ngOnInit(): void {
  }

  validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
  };

  onSubmit() {
    this.submitted = true;
    console.log(this.email)
    console.log(this.firstName)
    console.log(this.lastName)
    console.log(this.phone)
    console.log(this.username)
    console.log(this.password)

    if (!this.email || !this.firstName || !this.lastName || !this.firstName || !this.phone || !this.username || !this.password)
    {
      this.emptyFields = true;
      console.log("GOL");
      console.log(this.submitted);
      console.log(this.emptyFields);
    } else {
      this.emptyFields = false;
      if (!this.validateEmail(this.email))
      {
          this.validMail = false;
      }
      else {
        this.validMail = true;
        this.fbs.addUser(this.email, this.firstName, this.lastName, this.phone, this.username, this.password);
      }
    }
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}
