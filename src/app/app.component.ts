import { Component } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  // Set our map properties
  mapCenter = [26.1025, 44.4268];
  basemapType = 'satellite';
  mapZoomLevel = 12;
  isLogged = false;

  constructor(private router: Router) { }
  

  // See app.component.html
  mapLoadedEvent(status: boolean) {
    console.log('The map loaded: ' + status);
  }

  login() {
      this.router.navigate(['/login']);
    }

  signup() {
    this.router.navigate(['/register']);
  }
}

