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

import './SubRoutes.jsx';

@Route('$default')
@Route('/main')
@Route('/main/*')
export class MainRoute {

    get title() {
        return 'Welcome, ' + this.scope.store.username + '!';
    }

    get view() {
        return <div>
            <h2>Your Profile</h2>
            <div>{ this.scope.store.profile }</div>
            <route:link to="/edit">Edit</route:link>
            <hr/>
            <route:provider namespace="ext" as={ page }>
                { page.contents }
            </route:provider>
        </div>;
    }
}

@Route('/login')
export class LoginRoute {

    @Observable username;

    get title() {
        return 'Login';
    }

    login() {
        this.scope.store.username = this.username;
        this.router.setPath(this.queryParams.redirect || '/main');
    }

    get view() {
        return (
            <div>
                Please enter a username: <input bind:value={ this.username }/>
                <button onClick={ () => this.login() }>Login</button>
            </div>
        );
    }
}

@Route('/edit')
export class EditRoute {

    @Observable profile = this.scope.store.profile;

    get title() {
        return 'Edit Profile';
    }

    save() {
        this.scope.store.profile = this.profile;
        this.router.setPath('/main');
    }

    get hasUnsavedChanges() {
        return this.profile !== this.scope.store.profile;
    }

    revertChanges() {
        this.profile = this.scope.store.profile;
    }

    get view() {
        return (
            <div>
                <textarea bind:value={this.profile} />
                <button onClick={ () => this.save() }>Save</button>
            </div>
        );
    }
}
