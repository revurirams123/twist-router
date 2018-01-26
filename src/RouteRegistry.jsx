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

import Path from './Path';

export default class RouteManager {

    static defaultPath;
    static namespaces = {};

    /**
     * Register a path expression with a Route class.
     * This is called internally by the `@Route` decorator.
     */
    static register(namespace = '', pathExpr, route) {
        let ns = this.namespaces[namespace];
        if (!ns) {
            ns = this.namespaces[namespace] = {
                paths: []
            };
        }

        const path = new Path(pathExpr, route);

        if (pathExpr === '$default') {
            if (ns.defaultPath) {
                console.warn('There is already a default route ($default) - this will override the previous default route');
            }
            ns.defaultPath = path;
        }
        else {
            ns.paths.push(path);
        }
    }

    /**
     * Resolve a concrete path to a Route.
     * This is called by the <router> component.
     */
    static resolve(namespace = '', path) {
        let ns = this.namespaces[namespace];
        if (!ns) {
            console.warn('No paths registered for the namespace: ' + namespace);
            return;
        }

        let paths = ns.paths;
        let match;
        for (let i = 0, l = paths.length; i < l; ++i) {
            if (paths[i].check(path)) {
                if (match) {
                    console.warn('More than one match for path ' + path + ' - this will override the previous match');
                }
                match = paths[i];
            }
        }

        return match || ns.defaultPath;
    }

    /**
     * Print out a list of the path expressions and the class they correspond to; useful for debugging.
     */
    static toString() {
        return Object.keys(this.namespaces).map(namespace => {
            let prefix = namespace ? '[' + namespace + '] ' : '';
            let ns = this.namespaces[namespace];
            let strs = [];
            if (ns.defaultPath) {
                strs.push(prefix + '$default -> ' + ns.defaultPath.RouteClass.name);
            }
            ns.paths.forEach(p => strs.push(prefix + p.pathStr + ' -> ' + p.RouteClass.name));
            return strs.join('\n');
        }).join('\n');
    }

    /**
     * Clear all the registered routes - useful for testing
     */
    static clear(namespace) {
        if (namespace !== undefined) {
            // Just clear the routes for the given namespace
            delete this.namespaces[namespace];
            return;
        }

        // Clear all routes
        RouteManager.namespaces = {};
    }

}
