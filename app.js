define("DirectionsEvents", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DirectionsEvents = (function () {
        function DirectionsEvents() {
        }
        DirectionsEvents.DIRECTIONS_UPDATED = 'directionsUpdated';
        DirectionsEvents.DIRECTIONS_ERROR = 'directionsError';
        return DirectionsEvents;
    }());
    exports.DirectionsEvents = DirectionsEvents;
});
define("Location3d", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Location3d = (function () {
        function Location3d(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        return Location3d;
    }());
    exports.Location3d = Location3d;
});
define("DistanceTools", ["require", "exports", "proj4"], function (require, exports, proj) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DistanceTools = (function () {
        function DistanceTools() {
        }
        DistanceTools.calcDistance3d = function (locations) {
            var sum = 0;
            for (var i = 0; i < locations.length - 1; i++) {
                sum += this.getDistance3d(locations[i], locations[i + 1]);
            }
            return sum;
        };
        DistanceTools.getDistance3d = function (p1, p2) {
            var transformedP1 = proj('EPSG:4326', 'EPSG:6173', { x: p1.y, y: p1.x });
            var transformedP2 = proj('EPSG:4326', 'EPSG:6173', { x: p2.y, y: p2.x });
            var xdiff = transformedP2["x"] - transformedP1["x"];
            var ydiff = transformedP2["y"] - transformedP1["y"];
            var zdiff = p2.z - p1.z;
            var xPow = Math.pow(xdiff, 2);
            var yPow = Math.pow(ydiff, 2);
            var zPow = Math.pow(zdiff, 2);
            var sumPow = xPow + yPow + zPow;
            var distance3d = Math.sqrt(sumPow);
            return distance3d;
        };
        DistanceTools.calcDistance2d = function (locations) {
            var sum = 0;
            for (var i = 0; i < locations.length - 1; i++) {
                sum += this.getDistance2d(locations[i], locations[i + 1]);
            }
            return sum;
        };
        DistanceTools.getDistance2d = function (p1, p2) {
            var transformedP1 = proj('EPSG:4326', 'EPSG:6173', { x: p1.longitude, y: p1.latitude });
            var transformedP2 = proj('EPSG:4326', 'EPSG:6173', { x: p2.longitude, y: p2.latitude });
            var deltaX = transformedP2["x"] - transformedP1["x"];
            var deltaY = transformedP2["y"] - transformedP1["y"];
            var distance = this.calcDist2d(deltaX, deltaY);
            return distance;
        };
        DistanceTools.calcDist2d = function (xdiff, ydiff) {
            var xpow = Math.pow(xdiff, 2);
            var ypow = Math.pow(ydiff, 2);
            var powSum = xpow + ypow;
            var l = Math.sqrt(powSum);
            return l;
        };
        return DistanceTools;
    }());
    exports.DistanceTools = DistanceTools;
});
define("map", ["require", "exports", "DirectionsEvents", "Location3d", "DistanceTools", "proj4"], function (require, exports, DirectionsEvents_1, Location3d_1, DistanceTools_1, proj) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = new function Map() {
        var map = new Microsoft.Maps.Map(document.getElementById('myMap'), {
            zoom: 11,
            mapTypeId: Microsoft.Maps.MapTypeId.grayscale
        });
        proj.defs("EPSG:6173", "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +vunits=m +no_defs");
        var directionsManager;
        Microsoft.Maps.loadModule(["Microsoft.Maps.SpatialMath", "Microsoft.Maps.Directions"], function () {
            directionsManager = new Microsoft.Maps.Directions.DirectionsManager(map);
            var sundsvallWayPoint = new Microsoft.Maps.Directions.Waypoint({ address: 'Sunsdvall, Sweden' });
            var areWayPoint = new Microsoft.Maps.Directions.Waypoint({ address: 'Åre, Sweden' });
            directionsManager.addWaypoint(sundsvallWayPoint);
            directionsManager.addWaypoint(areWayPoint);
            Microsoft.Maps.Events.addHandler(directionsManager, DirectionsEvents_1.DirectionsEvents.DIRECTIONS_UPDATED, directionsUpdated);
            directionsManager.calculateDirections();
        });
        function directionsUpdated(routeEvt) {
            var serverRouteLength = routeEvt.route[0].routeLegs[0].summary.distance;
            console.log("Length provided by server: " + serverRouteLength);
            var spatialMathLength = Microsoft.Maps.SpatialMath.getLengthOfPath(routeEvt.route[0].routePath);
            console.log("Spatial math length: " + spatialMathLength);
            var planarLength = DistanceTools_1.DistanceTools.calcDistance2d(routeEvt.route[0].routePath);
            console.log("Planar length: " + planarLength);
            getElevation(routeEvt.route[0].routePath).then(function (r) { return r.json(); }).then(function (json) {
                var elevations = json.resourceSets[0].resources[0].elevations;
                var location3ds = addZToLocation(routeEvt.route[0].routePath, elevations);
                var threeDLength = DistanceTools_1.DistanceTools.calcDistance3d(location3ds);
                console.log("3d route length: " + threeDLength);
            });
        }
        function addZToLocation(locations, z) {
            var locations3ds = new Array();
            for (var i = 0; i < locations.length; i++) {
                var location3d = new Location3d_1.Location3d(locations[i].latitude, locations[i].longitude, z[i]);
                locations3ds.push(location3d);
            }
            return locations3ds;
        }
        ;
        function getElevation(locations) {
            var flattenStringifiedPoints = locations.map(function (l) {
                return l.latitude.toString() + "," + l.longitude.toString();
            });
            return fetch('http://dev.virtualearth.net/REST/v1/Elevation/List?key=[BING MAPS KEY]', {
                body: "points=" + flattenStringifiedPoints.join(','),
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