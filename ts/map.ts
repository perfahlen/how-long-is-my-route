/// <reference path="./../../Bing-Maps-V8-TypeScript-Definitions/types/MicrosoftMaps/Microsoft.Maps.All.d.ts" />

import {DirectionsEvents} from "./DirectionsEvents";
import {Location3d} from "./Location3d";
import {DistanceTools} from "./DistanceTools";

import * as proj from 'proj4';

export default new function Map(): void {

    let map = new Microsoft.Maps.Map(document.getElementById('myMap'), {
        zoom: 11,
        mapTypeId: Microsoft.Maps.MapTypeId.grayscale
    });

    proj.defs("EPSG:6173","+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +vunits=m +no_defs");

    let directionsManager: Microsoft.Maps.Directions.DirectionsManager;

    Microsoft.Maps.loadModule(["Microsoft.Maps.SpatialMath", "Microsoft.Maps.Directions"], function () {
        directionsManager = new Microsoft.Maps.Directions.DirectionsManager(map);
        const sundsvallWayPoint = new Microsoft.Maps.Directions.Waypoint({ address: 'Sunsdvall, Sweden'});
        const areWayPoint = new Microsoft.Maps.Directions.Waypoint({address: 'Åre, Sweden'});
        directionsManager.addWaypoint(sundsvallWayPoint);
        directionsManager.addWaypoint(areWayPoint);
        
        Microsoft.Maps.Events.addHandler(directionsManager, DirectionsEvents.DIRECTIONS_UPDATED, directionsUpdated);
        directionsManager.calculateDirections();
    });

    function directionsUpdated(routeEvt: Microsoft.Maps.Directions.IDirectionsEventArgs) : void{
        const serverRouteLength = routeEvt.route[0].routeLegs[0].summary.distance;
        console.log(`Length provided by server: ${serverRouteLength}`);

        const spatialMathLength = Microsoft.Maps.SpatialMath.getLengthOfPath(routeEvt.route[0].routePath);
        console.log(`Spatial math length: ${spatialMathLength}`);

        const planarLength = DistanceTools.calcDistance2d(routeEvt.route[0].routePath);
        console.log(`Planar length: ${planarLength}`);

        getElevation(routeEvt.route[0].routePath).then(r => r.json()).then(json => {
            const elevations = json.resourceSets[0].resources[0].elevations;
            const location3ds = addZToLocation(routeEvt.route[0].routePath, elevations);
            var threeDLength = DistanceTools.calcDistance3d(location3ds);
            console.log(`3d route length: ${threeDLength}`);
        });
    }

    function addZToLocation(locations: Microsoft.Maps.Location[], z: number[]): Location3d[]{
        var locations3ds = new Array<Location3d>();
        for (let i = 0; i < locations.length; i++){
            let location3d = new Location3d(locations[i].latitude, locations[i].longitude, z[i]);
            locations3ds.push(location3d);
        }
        return locations3ds;
    };

    function getElevation(locations: Microsoft.Maps.Location[]): Promise<Response>{
        let flattenStringifiedPoints = locations.map(l => {
            return `${l.latitude.toString()},${l.longitude.toString()}`;
        });

        return fetch(
            'http://dev.virtualearth.net/REST/v1/Elevation/List?key=[BING MAPS KEY]',{
                body: `points=${flattenStringifiedPoints.join(',')}`,
                method: 'POST',
                headers: {
                    'content-type': 'text/plain; charset=utf-8'
                }
            });
    };
}();