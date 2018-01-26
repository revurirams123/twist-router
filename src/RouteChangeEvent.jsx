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

/**
 * Event capturing a route change - this provides methods for aborting, or redirecting the route
 */
export default class RouteChangeEvent {

    static ABORT = 'abort';
    static REDIRECT = 'redirect';

    constructor(newPath, oldPath) {
        this._newPath = newPath;
        this._oldPath = oldPath;
        this._operation;
    }

    get oldPath() {
        return this._oldPath;
    }

    get newPath() {
        return this._newPath;
    }

    /**
     * Abort the route change - this keeps it on the current route
     */
    abort() {
        this._operation = RouteChangeEvent.ABORT;
        this._newPath = this._oldPath;
    }

    /**
     * Redirect the event to a different path
     */
    redirect(path) {
        this._operation = RouteChangeEvent.REDIRECT;
        this._newPath = path;
    }

}
