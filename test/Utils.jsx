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

import Test from './Test';

export default class Utils {

    static waitForWindowEvent(eventName) {
        return new Promise((resolve) => {

            let resolved = false;
            let onEvent = function() {
                if (!resolved) {
                    resolved = true;

                    // We have to remove the event listener in a timeout, because
                    // the history polyfill complains if we modify the listeners while
                    // it's iterating over them.
                    setTimeout(() => {
                        window.removeEventListener(eventName, onEvent);
                    });

                    Test.commit();
                    resolve();
                }
            };
            window.addEventListener(eventName, onEvent);
        });
    }

    static waitForRouterEvent(router, eventName) {
        return new Promise((resolve) => {
            let onEvent = function() {
                router.off(eventName, onEvent);
                Test.commit();
                resolve();
            };
            router.on(eventName, onEvent);
        });
    }

    static doLocationOperation(op) {
        let waitPromise = Utils.waitForWindowEvent('popstate');
        op();
        return waitPromise;
    }

    static setLocation(href) {
        return Utils.doLocationOperation(() => window.location.href = href);
    }

    static doRouterOperation(op, router) {
        let waitPromise = Utils.waitForRouterEvent(router, 'update');
        op();
        return waitPromise;
    }

}
