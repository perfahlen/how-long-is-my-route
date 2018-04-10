/// <reference path="./../../Bing-Maps-V8-TypeScript-Definitions/types/MicrosoftMaps/Microsoft.Maps.All.d.ts" />

import * as proj from 'proj4';
import {Location3d} from './Location3d';

export class DistanceTools{

    static calcDistance3d(locations: Location3d[]): number{
        let sum = 0;
        for (let i = 0; i < locations.length -1; i++){
            sum += this.getDistance3d(locations[i], locations[i + 1]);
        }
        return sum;
    }

    private static getDistance3d(p1: Location3d, p2: Location3d): number{
        const transformedP1 = proj('EPSG:4326', 'EPSG:6173', {x: p1.y, y: p1.x});
        const transformedP2 = proj('EPSG:4326', 'EPSG:6173', {x: p2.y, y: p2.x});

        const xdiff = transformedP2["x"] -  transformedP1["x"];
        const ydiff = transformedP2["y"] - transformedP1["y"];
        const zdiff = p2.z - p1.z;

        const xPow = Math.pow(xdiff, 2);
        const yPow = Math.pow(ydiff, 2);
        const zPow = Math.pow(zdiff, 2);

        const sumPow = xPow + yPow + zPow;
        const distance3d  = Math.sqrt(sumPow);

        return distance3d;
    }

    static calcDistance2d(locations: Microsoft.Maps.Location[]): number{
        let sum = 0;
        for (let i = 0; i < locations.length -1; i++){
            sum += this.getDistance2d(locations[i], locations[i + 1]);
        }
        return sum;
    }

    
    private static getDistance2d(p1: Microsoft.Maps.Location, p2: Microsoft.Maps.Location): number{

        const transformedP1 = proj('EPSG:4326', 'EPSG:6173', {x: p1.longitude, y: p1.latitude});
        const transformedP2 = proj('EPSG:4326', 'EPSG:6173', {x: p2.longitude, y: p2.latitude});

        const deltaX = transformedP2["x"] - transformedP1["x"];
        const deltaY = transformedP2["y"] - transformedP1["y"];

        const distance = this.calcDist2d(deltaX, deltaY);

        return distance;
    }

    private static calcDist2d(xdiff: number, ydiff: number): number{

        const xpow = Math.pow(xdiff, 2);
        const ypow = Math.pow(ydiff, 2);
        const powSum = xpow + ypow; 
        const l = Math.sqrt(powSum);

        return l;
    }

}