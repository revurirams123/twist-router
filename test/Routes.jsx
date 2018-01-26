/*
 *  Copyright 2017 Adobe Systems Incorporated. All rights reserved.
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

import assert from 'assert';
import RouteRegistry from '../src/RouteRegistry';

export default class Routes {

    static basicApp(prefix = '') {
        RouteRegistry.clear();

        @Route(prefix + 'RouteA/:id')
        class RouteA {
            get title() {
                return 'Route A: ' + this.id;
            }
        }
        assert(RouteA);

        @Route(prefix + 'RouteB-alt')
        @Route(prefix + 'RouteB')
        class RouteB {
            get title() {
                return 'Route B';
            }
        }
        assert(RouteB);

        @Route('$default')
        class RouteDefault {
            get title() {
                return 'Default Route';
            }
        }
        assert(RouteDefault);
    }

    static nestedApp() {

        @Route('$default')
        class Default {
            get content() {
                return <div>Default Route</div>;
            }
        }
        assert(Default);

        @Route('pages/*')
        class Pages {

            get content() {
                return <route:provider namespace="pages" as={ route }>
                    { route.pageContent }
                </route:provider>;
            }
        }
        assert(Pages);

        @Route('pages', 'pages/1/:name')
        class RouteP1 {
            get pageContent() {
                return <div>Page 1: { this.name }</div>;
            }
        }
        assert(RouteP1);

        @Route('pages', 'pages/2/:name')
        class RouteP2 {
            get pageContent() {
                return <div>Page 2: { this.name }</div>;
            }
        }
        assert(RouteP2);

        @Route('pages', '$default')
        class RouteP3 {
            get pageContent() {
                return <div>Page Not Found</div>;
            }
        }
        assert(RouteP3);
    }

    static clear(namespace) {
        RouteRegistry.clear(namespace);
    }

    static print() {
        return RouteRegistry.toString();
    }

}
