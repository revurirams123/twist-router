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

// For the purposes of this example, we use a simple class as a store.
// In a real application, you'd use @twist/core.
export default class Store {

    @Observable _username = localStorage.getItem('username');
    @Observable _profile = localStorage.getItem('profile') || 'Describe yourself!';

    get username() {
        return this._username;
    }

    set username(username) {
        this._username = username;
        localStorage.setItem('username', username);
    }

    get profile() {
        return this._profile;
    }

    set profile(profile) {
        this._profile = profile;
        localStorage.setItem('profile', profile);
    }

}
