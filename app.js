define("DirectionsEvents", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DirectionsEvents {
    }
    DirectionsEvents.DIRECTIONS_UPDATED = 'directionsUpdated';
    DirectionsEvents.DIRECTIONS_ERROR = 'directionsError';
    exports.DirectionsEvents = DirectionsEvents;
});
define("Location3d", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Location3d {
        constructor(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
    }
    exports.Location3d = Location3d;
});
define("DistanceTools", ["require", "exports", "proj4"], function (require, exports, proj) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DistanceTools {
        static calcDistance3d(locations) {
            let sum = 0;
            for (let i = 0; i < locations.length - 1; i++) {
                sum += this.getDistance3d(locations[i], locations[i + 1]);
            }
            return sum;
        }
        static getDistance3d(p1, p2) {
            const transformedP1 = proj('EPSG:4326', 'EPSG:6173', { x: p1.y, y: p1.x });
            const transformedP2 = proj('EPSG:4326', 'EPSG:6173', { x: p2.y, y: p2.x });
            const xdiff = transformedP2["x"] - transformedP1["x"];
            const ydiff = transformedP2["y"] - transformedP1["y"];
            const zdiff = p2.z - p1.z;
            const xPow = Math.pow(xdiff, 2);
            const yPow = Math.pow(ydiff, 2);
            const zPow = Math.pow(zdiff, 2);
            const sumPow = xPow + yPow + zPow;
            const distance3d = Math.sqrt(sumPow);
            return distance3d;
        }
        static calcDistance2d(locations) {
            let sum = 0;
            for (let i = 0; i < locations.length - 1; i++) {
                sum += this.getDistance2d(locations[i], locations[i + 1]);
            }
            return sum;
        }
        static getDistance2d(p1, p2) {
            const transformedP1 = proj('EPSG:4326', 'EPSG:6173', { x: p1.longitude, y: p1.latitude });
            const transformedP2 = proj('EPSG:4326', 'EPSG:6173', { x: p2.longitude, y: p2.latitude });
            const deltaX = transformedP2["x"] - transformedP1["x"];
            const deltaY = transformedP2["y"] - transformedP1["y"];
            const distance = this.calcDist2d(deltaX, deltaY);
            return distance;
        }
        static calcDist2d(xdiff, ydiff) {
            const xpow = Math.pow(xdiff, 2);
            const ypow = Math.pow(ydiff, 2);
            const powSum = xpow + ypow;
            const l = Math.sqrt(powSum);
            return l;
        }
    }
    exports.DistanceTools = DistanceTools;
});
define("map", ["require", "exports", "DirectionsEvents", "Location3d", "DistanceTools", "proj4"], function (require, exports, DirectionsEvents_1, Location3d_1, DistanceTools_1, proj) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = new function Map() {
        let map = new Microsoft.Maps.Map(document.getElementById('myMap'), {
            zoom: 11,
            mapTypeId: Microsoft.Maps.MapTypeId.grayscale
        });
        proj.defs("EPSG:6173", "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +vunits=m +no_defs");
        let directionsManager;
        Microsoft.Maps.loadModule(["Microsoft.Maps.SpatialMath", "Microsoft.Maps.Directions"], function () {
            directionsManager = new Microsoft.Maps.Directions.DirectionsManager(map);
            const sundsvallWayPoint = new Microsoft.Maps.Directions.Waypoint({ address: 'Sunsdvall, Sweden' });
            const areWayPoint = new Microsoft.Maps.Directions.Waypoint({ address: 'Åre, Sweden' });
            directionsManager.addWaypoint(sundsvallWayPoint);
            directionsManager.addWaypoint(areWayPoint);
            Microsoft.Maps.Events.addHandler(directionsManager, DirectionsEvents_1.DirectionsEvents.DIRECTIONS_UPDATED, directionsUpdated);
            directionsManager.calculateDirections();
        });
        function directionsUpdated(routeEvt) {
            const serverRouteLength = routeEvt.route[0].routeLegs[0].summary.distance;
            console.log(`Length provided by server: ${serverRouteLength}`);
            const spatialMathLength = Microsoft.Maps.SpatialMath.getLengthOfPath(routeEvt.route[0].routePath);
            console.log(`Spatial math length: ${spatialMathLength}`);
            const planarLength = DistanceTools_1.DistanceTools.calcDistance2d(routeEvt.route[0].routePath);
            console.log(`Planar length: ${planarLength}`);
            getElevation(routeEvt.route[0].routePath).then(r => r.json()).then(json => {
                const elevations = json.resourceSets[0].resources[0].elevations;
                const location3ds = addZToLocation(routeEvt.route[0].routePath, elevations);
                debugger;
                const length3d = DistanceTools_1.DistanceTools.calcDistance3d([location3ds[0], location3ds[location3ds.length - 1]]);
                const length2d = DistanceTools_1.DistanceTools.calcDistance2d([routeEvt.route[0].routePath[0], routeEvt.route[0].routePath[routeEvt.route[0].routePath.length - 1]]);
                var threeDLength = DistanceTools_1.DistanceTools.calcDistance3d(location3ds);
                console.log(`3d route length: ${threeDLength}`);
            });
        }
        function addZToLocation(locations, z) {
            var locations3ds = new Array();
            for (let i = 0; i < locations.length; i++) {
                let location3d = new Location3d_1.Location3d(locations[i].latitude, locations[i].longitude, z[i]);
                locations3ds.push(location3d);
            }
            return locations3ds;
        }
        ;
        function getElevation(locations) {
            let flattenStringifiedPoints = locations.map(l => {
                return `${l.latitude.toString()},${l.longitude.toString()}`;
            });
            return fetch('http://dev.virtualearth.net/REST/v1/Elevation/List?key=AtdwAaBSnuace6JXHBTvVptnkPHfkrovH-OKVwNm4xYpokb3wAcuSDqHSxtuIgDO', {
                body: `points=${flattenStringifiedPoints.join(',')}`,
                method: 'POST',
                headers: {
                    'content-type': 'text/plain; charset=utf-8'
                }
            });
        }
        ;
    }();
});
//# sourceMappingURL=app.js.map