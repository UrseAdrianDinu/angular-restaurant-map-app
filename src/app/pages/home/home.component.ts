import {
    Component,
    OnInit,
    ViewChild,
    ElementRef,
    Input,
    Output,
    EventEmitter,
    OnDestroy
} from "@angular/core";
import { setDefaultOptions, loadModules } from 'esri-loader';
import esri = __esri; // Esri TypeScript Types
import {Observable, Subscription } from "rxjs";
import { FirebaseService, ITestItem } from "src/app/services/database/firebase";
import {GeolocationService} from '@ng-web-apis/geolocation';
import { FirebaseMockService } from "src/app/services/database/firebase-mock";
import DirectionsViewModel = __esri.DirectionsViewModel;
import { Router } from '@angular/router';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

    @Output() mapLoadedEvent = new EventEmitter<boolean>();

    // The <div> where we will place the map
    @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;

    // register Dojo AMD dependencies
    _Map;
    _MapView;
    _FeatureLayer;
    _Graphic;
    _GraphicsLayer;
    _Route;
    _RouteParameters;
    _FeatureSet;
    _Point;
    _locator;
    _Locate;
    _Track;

    _ButtonMenu;

    _DirectionsViewModel;
    // Instances
    map: esri.Map;
    view: esri.MapView;
    pointGraphic: esri.Graphic;
    graphicsLayer: esri.GraphicsLayer;

    isLogged = false;

    // Attributes
    zoom = 10;
    center: Array<number> = [26.1025, 44.4268];
    basemap = "streets-vector";
    loaded = false;
    pointCoords: number[] = [26.1025, 44.4268];
    dir: number = 0;
    count: number = 0;
    timeoutHandler = null;

    //folosit pt a salva coord restaurantului
    locationCoords: Array<number> = [0,0];

    //nume rest
    restname : string

    // firebase sync
    isConnected: boolean = false;
    subscriptionList: Subscription;
    subscriptionObj: Subscription;

    constructor(
        private fbs: FirebaseService,
        private router: Router
    ) { }

    async initializeMap() {
        try {
            // configure esri-loader to use version x from the ArcGIS CDN
            // setDefaultOptions({ version: '3.3.0', css: true });
            setDefaultOptions({ css: true });
            console.log("INITIALIZE MAP");

            // Load the modules for the ArcGIS API for JavaScript
            const [esriConfig, Map, MapView,
                FeatureLayer, Graphic, Point,
                GraphicsLayer, route, RouteParameters,
                FeatureSet, Locate, Locator,
                DirectionsViewModel, Track, ButtonMenu] = await loadModules([
                "esri/config",
                "esri/Map",
                "esri/views/MapView",
                "esri/layers/FeatureLayer",
                "esri/Graphic",
                "esri/geometry/Point",
                "esri/layers/GraphicsLayer",
                "esri/rest/route",
                "esri/rest/support/RouteParameters",
                "esri/rest/support/FeatureSet",
                "esri/widgets/Locate",
                "esri/rest/locator",
                "esri/widgets/Directions/DirectionsViewModel",
                "esri/widgets/Track",
                "esri/widgets/FeatureTable/Grid/support/ButtonMenu"
            ]);

            esriConfig.apiKey = "AAPK56c0ec3f83844ca6aec2c1a3f4c50481XfupaXXanCYXagEqkL81gQV3ZHQxKx8sDVpAs46n3Vpj1wNMQQ9umwwg-yJ4swAH";

            this._Map = Map;
            this._MapView = MapView;
            this._FeatureLayer = FeatureLayer;
            this._Graphic = Graphic;
            this._GraphicsLayer = GraphicsLayer;
            this._Route = route;
            this._RouteParameters = RouteParameters;
            this._FeatureSet = FeatureSet;
            this._Point = Point;
            this._locator = Locator;
            this._Locate = Locate;
            this._DirectionsViewModel = DirectionsViewModel;
            this._Track = Track;
            this._ButtonMenu = ButtonMenu;

            // Configure the Map
            const mapProperties = {
                basemap: this.basemap
            };



            this.map = new Map(mapProperties);

            this.addFeatureLayers();
            console.log("Aici:");
            //this.addPoint(this.pointCoords[1], this.pointCoords[0], true);
            this.addPoint(this.center[1], this.center[0], true);
            // Initialize the MapView
            const mapViewProperties = {
                container: this.mapViewEl.nativeElement,
                center: this.center,
                zoom: this.zoom,
                map: this.map
            };
            console.log("DUPA ADD");


            const places = ["Choose a place type...", "Parks and Outdoors", "Coffee shop", "Gas station", "Food", "Hotel"];

            this.view = new MapView(mapViewProperties);

            // Fires `pointer-move` event when user clicks on "Shift"
            // key and moves the pointer on the view.
            this.view.on('pointer-move', ["Shift"], (event) => {
                let point = this.view.toMap({ x: event.x, y: event.y });
                console.log("map moved: ", point.longitude, point.latitude);
            });


            const locate = new Locate({
                view: this.view,
                useHeadingEnabled: false,
                goToOverride: function(view, options) {
                    console.log(options.target);
                    console.log(options.target.latitude);
                    console.log(options.target.longitude);
                    options.target.scale = 1500;
                    return view.goTo(options.target);
                }
            });

            console.log("DUPA LOCATE");

            const track = new Track({
                view: this.view,
                graphic: new Graphic({
                    symbol: {
                        type: "simple-marker",
                        size: "12px",
                        color: "green",
                        outline: {
                            color: "#efefef",
                            width: "1.5px"
                        }
                    }
                }),
                useHeadingEnabled: false
            });

            console.log("DUPA LOCATE");


            var addGraphic = (type: any, lng, lat) => {
                const point = { //Create a point
                    type: "point",
                    longitude: lng,
                    latitude: lat
                };
                const graphic = new this._Graphic({
                    symbol: {
                        type: "simple-marker",
                        color: (type === "origin") ? "white" : "black",
                        size: "8px"
                    } as any,
                    geometry: point
                });
                this.view.graphics.add(graphic);
            }
            this.view.ui.add(track, "top-right");

            await this.view.when(); // wait for map to load
            console.log("ArcGIS map loaded");
            this.view.ui.add(locate, "top-left");
            // this.addRouter();
            this.view.popup.actions[10] = [];
            console.log("WHEN");
            this.view.when(()=>{
                this.findPlaces(this.view.center);
            });
            console.log(this.view.center);

            // Event handler that fires each time an action is clicked.
            this.view.popup.on("trigger-action", (event) => {
                // Execute the measureThis() function if the measure-this action is clicked
                if (event.action.id === "route-action") {
                    console.log("SNT AICI")
                    this.locationCoords = [this.view.popup.location.latitude, this.view.popup.location.longitude]
                    // console.log("mere")
                    // console.log("acasa")
                    // console.log(this.center[1], this.center[0])
                    // console.log("rest")
                    // console.log(this.locationCoords[1],this.locationCoords[0])
                    // console.log(this.view.popup.title)
                    this.restname = this.view.popup.title
                    this.view.graphics.removeAll();
                    addGraphic("origin", this.center[0], this.center[1]);
                    addGraphic("destination", this.locationCoords[1],this.locationCoords[0]);
                    this.getRoutee();
                    var cleanScreen = () => {
                        this.view.graphics.removeAll();
                        this.view.ui.empty("top-right")
                        this.view.ui.remove(btn);
                        //buttonMenu.visible = false;
                    }

                    var reinitMap = () => {
                        this.view.when(()=>{
                            this.findPlaces(this.view.center);
                        });
                        this.view.ui.add(track, "top-right");
                    }
                    // const buttonMenu = new this._ButtonMenu ({
                    //     iconClass: "esri-icon-left",
                    //     items: [{
                    //         label: "Stop routing",
                    //         clickFunction: function (event) {
                    //             console.log("mere ura")
                    //             cleanScreen()
                    //             reinitMap()
                    //         }
                    //     }]
                    // });
                    //this.view.ui.add(buttonMenu, "top-left");

                    var btn = document.createElement('button');
                    btn.innerText = 'Stop routing';
                    btn.style.width = '100px';
                    btn.style.height = '25px';
                    btn.style.background = 'white';
                    btn.style.borderColor = '#009169';
                    btn.style.border = '5px';
                    this.view.ui.add(btn, 'bottom-left');
                    btn.addEventListener('click', () => {
                       console.log("mere")
                        cleanScreen()
                        reinitMap()
                    });
                }
                if (event.action.id === "review-action") {
                    this.view.graphics.add(
                        new this._Graphic({
                            popupTemplate: {
                                title: "Review pentru " + this.restname
                            }
                        }));
                }
            });
            return this.view;
        } catch (error) {
            console.log("EsriLoader: ", error);
        }
    }


    addFeatureLayers() {
        // Trailheads feature layer (points)
        // var trailheadsLayer: __esri.FeatureLayer = new this._FeatureLayer({
        //   url:
        //     "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trailheads/FeatureServer/0"
        // });

        // this.map.add(trailheadsLayer);


        // Trails feature layer (lines)
        // var trailsLayer: __esri.FeatureLayer = new this._FeatureLayer({
        //   url:
        //     "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer/0"
        // });

        // this.map.add(trailsLayer, 0);

        // Parks and open spaces (polygons)
        // var parksLayer: __esri.FeatureLayer = new this._FeatureLayer({
        //   url:
        //     "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Parks_and_Open_Space/FeatureServer/0"
        // });

        // this.map.add(parksLayer, 0);

        console.log("feature layers added");
    }

    getPosition(): Observable<any> {
        return Observable.create(observer => {
            window.navigator.geolocation.getCurrentPosition(position => {
                    observer.next(position);
                    observer.complete();
                },
                error => observer.error(error));
        });
    }

    addPoint(lat: number, lng: number, register: boolean) {
        console.log("Add point:");
        console.log(lat);
        console.log(lng);
        this.graphicsLayer = new this._GraphicsLayer();
        this.map.add(this.graphicsLayer);
        const point = { //Create a point
            type: "point",
            longitude: lng,
            latitude: lat
        };
        const simpleMarkerSymbol = {
            type: "simple-marker",
            color: [226, 119, 40],  // Orange
            outline: {
                color: [255, 255, 255], // White
                width: 1
            }
        };
        let pointGraphic = new this._Graphic({
            geometry: point,
            symbol: simpleMarkerSymbol
        });
        this.graphicsLayer.add(this.pointGraphic);

        if (register) {
            this.pointGraphic = pointGraphic;
        }
    }

    removePoint() {
        if (this.pointGraphic != null) {
            this.graphicsLayer.remove(this.pointGraphic);
        }
    }


    getRoutee() {
        const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

        const routeParams = new this._RouteParameters({
          stops: new this._FeatureSet({
             features: this.view.graphics.toArray()
          }),
          returnDirections: true
        });
        console.log("TEST");
        console.log(routeParams);
        console.log("TEST:");

        this._Route.solve(routeUrl, routeParams).then((data: any) => {
            for (let result of data.routeResults) {
                result.route.symbol = {
                    type: "simple-line",
                    color: [5, 150, 255],
                    width: 3
                };
                this.view.graphics.add(result.route);
            }

            // Display directions
            if (data.routeResults.length > 0) {
                const directions: any = document.createElement("ol");
                directions.classList = "esri-widget esri-widget--panel esri-directions__scroller";
                directions.style.marginTop = "0";
                directions.style.padding = "15px 15px 15px 30px";
                const features = data.routeResults[0].directions.features;

                let sum = 0;
                // Show each direction
                features.forEach((result: any, i: any) => {
                    sum += parseFloat(result.attributes.length);
                    const direction = document.createElement("li");
                    direction.innerHTML = result.attributes.text + " (" + result.attributes.length + " miles)";
                    directions.appendChild(direction);
                });

                sum = sum * 1.609344;
                console.log('dist (km) = ', sum);


                this.view.ui.empty("top-right");
                this.view.ui.add(directions, "top-right");

            }

        }).catch((error: any) => {
            console.log(error);
        });
    }
    addRouter() {
        const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

        this.view.on("click", (event) => {
            //console.log("point clicked: ", event.mapPoint.latitude, event.mapPoint.longitude);
            if (this.view.graphics.length === 0) {
                addGraphic("origin", event.mapPoint);
            } else if (this.view.graphics.length === 1) {
                addGraphic("destination", event.mapPoint);
                getRoute(); // Call the route service
            } else {
                this.view.graphics.removeAll();
                addGraphic("origin", event.mapPoint);
            }
        });

        var addGraphic = (type: any, point: any) => {
            const graphic = new this._Graphic({
                symbol: {
                    type: "simple-marker",
                    color: (type === "origin") ? "white" : "black",
                    size: "8px"
                } as any,
                geometry: point
            });
            this.view.graphics.add(graphic);
        }

        var getRoute = () => {
            const routeParams = new this._RouteParameters({
                stops: new this._FeatureSet({
                    features: this.view.graphics.toArray()
                }),
                returnDirections: true
            });

            this._Route.solve(routeUrl, routeParams).then((data: any) => {
                for (let result of data.routeResults) {
                    result.route.symbol = {
                        type: "simple-line",
                        color: [5, 150, 255],
                        width: 3
                    };
                    this.view.graphics.add(result.route);
                }

                // Display directions
                if (data.routeResults.length > 0) {
                    const directions: any = document.createElement("ol");
                    directions.classList = "esri-widget esri-widget--panel esri-directions__scroller";
                    directions.style.marginTop = "0";
                    directions.style.padding = "15px 15px 15px 30px";
                    const features = data.routeResults[0].directions.features;

                    let sum = 0;
                    // Show each direction
                    features.forEach((result: any, i: any) => {
                        sum += parseFloat(result.attributes.length);
                        const direction = document.createElement("li");
                        direction.innerHTML = result.attributes.text + " (" + result.attributes.length + " miles)";
                        directions.appendChild(direction);
                    });

                    sum = sum * 1.609344;
                    console.log('dist (km) = ', sum);

                    this.view.ui.empty("top-right");
                    this.view.ui.add(directions, "top-right");

                }

            }).catch((error: any) => {
                console.log(error);
            });
        }
    }


    showResults(results) {
        //locatia restaurantului
        // this.view.on("click", (event) => {
        //     console.log("point clicked: ", event.mapPoint.latitude, event.mapPoint.longitude);
        //     this.locationCoords = [event.mapPoint.latitude, event.mapPoint.longitude];
        //
        // });
        console.log(results);
        const routeAction = {

            title: "Find Route",
            id: "route-action",
            labelExpressionInfo: {
                expression: "\ue64a"  //esri-icon-directions2
            }
        };

        const reviewAction = {

            title: "Review",
            id: "review-action",
            labelExpressionInfo: {
                expression: "\ue64a"  //esri-icon-directions2
            }
        };
        this.view.popup.close();
        this.view.graphics.removeAll();
        results.forEach((result)=>{

            this.view.graphics.add(
                new this._Graphic({
                    attributes: result.attributes,
                    geometry: result.location,
                    symbol: {
                        type: "simple-marker",
                        color: "red",
                        size: "10px",
                        outline: {
                            color: "#ffffff",
                            width: "2px"
                        }
                    },
                    popupTemplate: {
                        title: "{PlaceName}",
                        content: "{Place_addr}" + "<br><br>" +
                            result.location.x.toFixed(5) + "," + result.location.y.toFixed(5) + "<br><br>" +
                            "{Phone}" + "<br><br>" +
                            "<a href=\"{URL}\">{URL}</a>" + "<br><br>",
                        // TODO ADD OTHER FIELDS
                        actions: [routeAction, reviewAction]
                    }
                }));
        });
        // if (results.length) {
        //   const g = this.view.graphics.getItemAt(0);
        //   this.view.popup.open({
        //     features: [g],
        //     location: g.geometry
        //   });
        // }
    }

    findPlaces(pt) {
        const geocodingServiceUrl = "http://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";

        const params = {
            categories: ["Italian Food"],
            location: pt,  // Paris (2.34602,48.85880)
            outFields: ["PlaceName","Place_addr", "Phone", "URL", "City","Region", "Rank", "Postal", "Country", "Distance"]
        }

        this._locator.addressToLocations(geocodingServiceUrl, params).then((results)=> {

            this.showResults(results);
        });
    }


    runTimer() {
        this.timeoutHandler = setTimeout(() => {
            // code to execute continuously until the view is closed
            // ...
            this.animatePointDemo();
            this.runTimer();
        }, 200);
    }

    animatePointDemo() {
        this.removePoint();
        switch (this.dir) {
            case 0:
                this.pointCoords[1] += 0.01;
                break;
            case 1:
                this.pointCoords[0] += 0.02;
                break;
            case 2:
                this.pointCoords[1] -= 0.01;
                break;
            case 3:
                this.pointCoords[0] -= 0.02;
                break;
        }

        this.count += 1;
        if (this.count >= 10) {
            this.count = 0;
            this.dir += 1;
            if (this.dir > 3) {
                this.dir = 0;
            }
        }

        this.addPoint(this.pointCoords[1], this.pointCoords[0], true);
    }

    stopTimer() {
        if (this.timeoutHandler != null) {
            clearTimeout(this.timeoutHandler);
            this.timeoutHandler = null;
        }
    }

    addPointItem() {
        console.log("Map center: " + this.view.center.latitude + ", " + this.view.center.longitude);
        this.fbs.addPointItem(this.view.center.latitude, this.view.center.longitude);
    }

    connectFirebase() {
        if (this.isConnected) {
            return;
        }
        this.isConnected = true;
        this.fbs.connectToDatabase();
        this.subscriptionList = this.fbs.getChangeFeedList().subscribe((items: ITestItem[]) => {
            console.log("got new items from list: ", items);
            this.graphicsLayer.removeAll();
            for (let item of items) {
                this.addPoint(item.lat, item.lng, false);
            }
        });
        this.subscriptionObj = this.fbs.getChangeFeedObj().subscribe((stat: ITestItem[]) => {
            console.log("item updated from object: ", stat);
        });
    }

    login() {
        this.router.navigate(['/login']);
    }

    signup() {
        this.router.navigate(['/register']);
    }



    ngOnInit() {

        // Initialize MapView and return an instance of MapView

        console.log("INIT")
        this.getPosition().subscribe(pos => {
            console.log(pos);
            console.log(pos.coords.latitude);
            console.log(pos.coords.longitude);
            this.center = [pos.coords.longitude, pos.coords.latitude]

            this.initializeMap().then(() => {
                // The map has been initialized
                console.log("mapView ready: ", this.view.ready);
                this.loaded = this.view.ready;
                this.mapLoadedEvent.emit(true);
                //this.runTimer();
                //this.addPointItem();
                this.addPoint(pos.coords.latitude,pos.coords.longitude,true);
            });

        });

    }

    ngOnDestroy() {
        if (this.view) {
            // destroy the map view
            this.view.container = null;
        }
        this.stopTimer();
    }
}
