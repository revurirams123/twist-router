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

var PAGES = {
    default: { title: 'Default Page', msg: 'I\'m not sure what I am' },
    p1: { title: 'Page 1', msg: 'I\'m a gnu', next: 'p2' },
    p2: { title: 'Page 2', msg: 'I\'m a g`nother gnu', next: 'p3' },
    p3: { title: 'Page 3', msg: 'I wish I could g`nash my teeth at you!', next: 'p4' },
};

@Route('ext', '$default')
@Route('ext', '/main/:pageid')
export class SubStoreRoute {

    get page() {
        return PAGES[this.pageid] || PAGES.default;
    }

    get contents() {
        return <g>
            <h3>{ this.page.title }</h3>
            <div>{ this.page.msg }</div>
            <route:link to={ '/main/' + (this.page.next || 'p1') }>{ this.page.next ? 'Next Page' : 'Go To Page 1' }</route:link>
        </g>;
    }
}
