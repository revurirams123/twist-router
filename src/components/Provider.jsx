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
import History from '../History';

@Component({ fork: true, events: [ 'change', 'update' ] })
export default class Router {

    @Attribute useHashUrls = true;
    @Attribute namespace;
    @Attribute forceReload = false;

    @Observable _currentRoute;
    @Observable _inheritedUseHashUrls = undefined;

    _getLinkHref(url) {
        const useHash = this._inheritedUseHashUrls !== undefined ? this._inheritedUseHashUrls : this.useHashUrls;
        return (useHash ? '#' : '') + url;
    }

    /**
     * The current path in the browser, excluding the query parameters. If you're using hash URLs, this does not include the hash
     */
    get currentPath() {
        return this.history.path;
    }

    /**
     * An object represeting the query parameters of the current path as a key-value map. The object itself is always defined
     * (i.e. it's `{}` if there are no query parameters).
     */
    get queryParams() {
        return this.history.queryParams;
    }

    /**
     * The current loaded route - this is the same as the `route` variable in `<route:provider as={ route }>`.
     */
    get currentRoute() {
        return this._currentRoute;
    }

    /**
     * A unique identifier for the current page in the browser history - you can use this to keep track of the same page, if it appears multiple times
     * in the history - e.g. if you want to remember the scroll position when the user hits the back button.
     */
    get historyId() {
        return this.history.id;
    }

    /**
     * Programmatically changes the path - this is what you should call from your code to update the path
     * (or use the <link> component which calls this.)
     *
     * @param {string} newPath The new path to transition to.
     * @param [Boolean] [replaceState=false] Whether or not the current entry in the browser's history stack should be replaced (as opposed to pushing a new entry).
     */
    setPath(newPath, replaceState) {
        this.history.setPath(newPath, replaceState);
    }

    /**
     * Go back to the previous page in the browser history
     */
    back() {
        this.history.back();
    }

    /**
     * Go forward to the next page in the browser history
     */
    forward() {
        this.history.forward();
    }

    /**
     * Read some data for the current route, via the browser History API - this returns whatever you stored via setState.
     *
     * @returns {Object} Data stored for the current route.
     */
    getState() {
        return this.history.getState();
    }

    /**
     * Store some data on the current route, via the browser History API - this replaces whatever data is currently stored.
     * You can read this back via getState when the user returns the page. Only use this to store transient view-related data
     * (like the scroll position).
     *
     * @param {Object} data Data to store in the current route.
     */
    setState(data) {
        this.history.setState(data);
    }

    /**
     * This gets called whenever the path changes, so we can update the route
     * @private
     */
    _update() {
        //console.log('Routed (' + this.namespace + ') ' + this._previousPath + ' => ' + this.currentPath);
        var match = RouteRegistry.resolve(this.namespace, this.currentPath);

        if (!match) {
            console.warn('No match for path ' + this.currentPath + ' - make sure you specify a default route');
            return;
        }

        if (this.forceReload || !match.update(this._currentRoute, this.currentPath)) {
            // We changed routes, so we have to dispose the current route and create another!

            if (this._currentRoute) {
                this._currentRoute.leave();
                this._currentRoute.dispose();
            }

            this._currentRoute = match.create(this, this.currentPath);
            this._currentRoute.enter();
        }

        // Triggered when the view is updated
        this.trigger('update');
    }

    _registerHistoryListeners() {
        this.listenTo(this.history, 'commit-change', this._update);

        // Propagate change events on the history, so they can be intercepted via the route-provider
        this.listenTo(this.history, 'change', event => this.trigger('change', event));

        // Install ourself on the scope
        this._parentRouter = this.scope.router;
        this.scope.router = this;
    }

    componentDidMount() {
        // Setup history service and update to the initial route
        if (this.scope.router) {
            this.history = this.scope.router.history;

            // Make sure we inherit the parent provider's useHashUrls (only the top-level provider can set this)
            this.watch(() => this.scope.router.useHashUrls, value => this._inheritedUseHashUrls = value);

            this._registerHistoryListeners();
            this._update();
        }
        else {
            this.history = this.link(new History(this.useHashUrls));

            // Make sure the useHashURLs setting gets updated whenever the attribute changes
            this.watch(() => this.useHashUrls, value => this.history.useHashUrls = value);

            this._registerHistoryListeners();
            this.history.init();
        }
    }

    render() {
        if (!this._currentRoute) {
            return <div />;
        }
        return this.renderChildren([ this._currentRoute ]);
    }
}
