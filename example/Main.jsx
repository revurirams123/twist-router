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


import ReactDOM from 'react-dom';

import Store from './Store';
import './Routes';

import MainLess from './Main.less';

@Component
export default class MainApplication {

    @Observable showLeaveWarning = false;
    @Observable leavePath;

    constructor() {
        super();

        this.scope.store = new Store;
    }

    logout() {
        this.scope.store.username = '';
        this.router.setPath('/login');
    }

    cancelLeave() {
        this.showLeaveWarning = false;
        this.leavePath = undefined;
    }

    leave(page) {
        page.revertChanges();
        this.router.setPath(this.leavePath);
        this.cancelLeave();
    }

    onChange(ev) {
        var isLoginRoute = (ev.newPath && ev.newPath.startsWith('/login'));

        // If we're not logged in, redirect to the login page
        if (!this.scope.store.username) {
            var newPath = isLoginRoute ? '/' : ev.newPath;
            ev.redirect('/login?redirect=' + encodeURIComponent(newPath));
            return;
        }

        if (!this.router) {
            return;
        }

        // If we have unsaved pages on the current page, show a warning to leave the page
        if (this.router.currentRoute && this.router.currentRoute.hasUnsavedChanges) {
            this.showLeaveWarning = true;
            this.leavePath = ev.newPath;
            ev.abort();
        }

        // If we're trying to visit the login route when already logged in, we just go back to the main page
        if (isLoginRoute) {
            ev.redirect('/');
            return;
        }
    }


    render() {
        return (
            <route:provider ref={ this.router } as={ page } onChange={ ev => this.onChange(ev) }>
                <h1>{ page.title }</h1>
                { page.view }
                <if condition={ this.showLeaveWarning }>
                    <div class={ MainLess.overlay }>
                        <div class={ MainLess.overlayContents }>
                            <h1>Unsaved Changes</h1>
                            <div>Are you sure you want to leave this page?</div>
                            <button onClick={ () => this.leave(page) }>Yes</button><button onClick={ () => this.cancelLeave() } >No</button>
                        </div>
                    </div>
                </if>
                <if condition={ this.scope.store.username }>
                    <hr/>
                    <button onClick={ () => this.logout() }>Logout</button>
                </if>
            </route:provider>
        );
    }
}

ReactDOM.render(<MainApplication />, document.body);

