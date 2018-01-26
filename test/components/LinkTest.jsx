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

/* global describe it beforeEach */
import assert from 'assert';
import Test from '../Test';
import Utils from '../Utils';
import Routes from '../Routes';

describe('<route:link>', () => {

    beforeEach(() => {
        // Make sure that we clear the routes and the path before each test
        Routes.clear();
        window.location.href = '#';
    });

    it('Using <route:link> to transition to another route (hashed urls)', async() => {
        Routes.basicApp();

        let divRef;
        let linkRef;
        let router;
        let jsx = Test.jsx(() => <route:provider ref={ router } as={ route }>
            <div ref={ divRef }>{ route.title }</div>
            <route:link ref={ linkRef } to="RouteB" class="link">Click Here</route:link>
        </route:provider>);

        assert.equal(divRef.textContent, 'Default Route');
        assert.equal(linkRef.href, '#RouteB');

        let linkElement = jsx.node.getElementsByClassName('link')[0];
        await Utils.doRouterOperation(() => linkElement.click(), router);

        assert.equal(divRef.textContent, 'Route B');
        assert.equal(window.location.hash, '#RouteB');

        jsx.dispose();
    });

    it('Using <route:link> to transition to another route (non-hashed urls)', async() => {
        Routes.basicApp('/');

        let divRef;
        let linkRef;
        let router;
        let jsx = Test.jsx(() => <route:provider useHashUrls={ false } ref={ router } as={ route }>
            <div ref={ divRef }>{ route.title }</div>
            <route:link ref={ linkRef } to="/RouteB" class="link">Click Here</route:link>
        </route:provider>);

        assert.equal(divRef.textContent, 'Default Route');
        assert.equal(linkRef.href, '/RouteB');

        let linkElement = jsx.node.getElementsByClassName('link')[0];
        await Utils.doRouterOperation(() => linkElement.click(), router);

        assert.equal(divRef.textContent, 'Route B');

        // Reset:
        await Utils.doRouterOperation(() => router.setPath('/'), router);
        assert.equal(divRef.textContent, 'Default Route');

        jsx.dispose();
    });

    it('Using <route:link> with invalid path should not throw exception', async() => {
        Routes.basicApp();

        let divRef;
        let router;
        let jsx = Test.jsx(() => <route:provider ref={ router } as={ route }>
            <div ref={ divRef }>{ route.title }</div>
            <route:link to="RouteA/%%%" class="link">Click Here</route:link>
        </route:provider>);

        assert.equal(divRef.textContent, 'Default Route');

        let linkElement = jsx.node.getElementsByClassName('link')[0];
        await Utils.doRouterOperation(() => linkElement.click(), router);

        assert.equal(divRef.textContent, 'Route A: %%%');
        assert.equal(window.location.hash, '#RouteA/%%%');

        jsx.dispose();
    });

    // XXX: Reenable when https://github.com/facebook/react/issues/10474 is fixed.
    it.skip('Should get an error if use <route:link> outside a <route:provider>', async() => {

        let makeRoute = function() {
            Test.jsx(() => <route:link to="RouteB">Click Here</route:link>);
        };

        assert.throws(makeRoute, Error, 'Using <route:link> outside of <route:provider> should give an error');
    });

});
