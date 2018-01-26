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

@Component
export default class Link {

    @Attribute to;

    constructor() {
        super();
        if (!this.scope.router) {
            throw new Error('<route:link> can only be used inside a <route:provider>');
        }
    }

    get href() {
        return this.scope.router._getLinkHref(this.to);
    }

    onClick(ev) {
        this.scope.router.setPath(this.to);
        ev.preventDefault();
    }

    render() {
        return (
            <a onClick={ ev => this.onClick(ev) } href={ this.href } { ...this.undeclaredAttributes() }>
                { this.children }
            </a>
        );
    }
}
