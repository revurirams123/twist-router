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

import RouteRegistry from '../RouteRegistry';

export default function(namespace, path) {
    function Route(target) {
        if (!path) {
            path = namespace;
            namespace = undefined;
        }
        if (!path) {
            throw new Error('@Route requires a path as an argument - for the default route, use "$default"');
        }

        RouteRegistry.register(namespace, path, target);
        return target;
    }

    if (typeof namespace === 'function') {
        return Route(); // They invoked the decorator without arguments. (This is an error, in the case of `Route`.)
    }

    return Route;
}
