/*
 *  Copyright 2016 Adobe Systems Incorporated. All rights reserved.
 *  This file is licensed to you under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License. You may obtain a copy
 *  of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under
 *  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 *  OF ANY KIND, either express or implied. See the License for the specific language
 *  governing permissions and limitations under the License.
 *
 */

import pathToRegexp from 'path-to-regexp';

export default class Path {

    constructor(path, routeClass) {
        this.keys = [];
        this.pathStr = path;
        this.path = pathToRegexp(path, this.keys);
        this.RouteClass = routeClass;
    }

    check(path) {
        return this.path.test(path);
    }

    getValuesForPath(path) {
        var values = this.path.exec(path);

        if (!values) {
            return [];
        }

        // The first value is the path itself, so throw it away
        values.shift();

        // Decode any URI-encoded values in the path
        return values.map(value => {
            try {
                // Avoid that decodeURIComponent converts undefined value to 'undefined' string
                value = value !== undefined ? decodeURIComponent(value) : undefined;
            }
            catch(e) {
                console.warn(`Invalid URI component passed to Path.create(): '${value}'. `
                    + `Are you calling encodeURIComponent() when constructing your URLs?`);
            }
            return value;
        });
    }

    /**
     * Create a new route instance, passing in the route's parameters as the initial parameter values
     */
    create(router, path) {
        var values = this.getValuesForPath(path);
        return new this.RouteClass(router, this.keys, values);
    }

    /**
     * Update an existing route instance with new values - this only works if it's the exact same @Route() decorator.
     * @returns {Boolean} Returns true if the route was able to be updated; false if it wasn't.
     */
    update(route, path) {
        if (route instanceof this.RouteClass && route._keys === this.keys) {
            // It's the same route instance with params, so we can update it directly
            var values = this.getValuesForPath(path);
            this.keys.forEach((key, index) => {
                route[key.name] = values[index];
            });
            return true;
        }

        return false;
    }

}
