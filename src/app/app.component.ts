import { Component } from '@angular/core';

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

  

  // See app.component.html
  mapLoadedEvent(status: boolean) {
    console.log('The map loaded: ' + status);
  }
}

