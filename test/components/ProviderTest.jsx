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
import sinon from 'sinon';
import Test from '../Test';
import Utils from '../Utils';
import Routes from '../Routes';

import RouteChangeEvent from '../../src/RouteChangeEvent';

describe('<route:provider>', () => {

    beforeEach(() => {
        // Make sure that we clear the routes and the path before each test
        Routes.clear();
        window.location.href = '#';
    });

    it('Basic <route:provider> and navigation using hash URLs', async() => {
        Routes.basicApp();

        let divRef;
        let jsx = Test.jsx(() => <route:provider as={ route }>
            <div ref={ divRef }>{ route.title }</div>
        </route:provider>);

        assert.equal(divRef.textContent, 'Default Route');

        await Utils.setLocation('#RouteB');
        assert.equal(divRef.textContent, 'Route B');

        await Utils.setLocation('#RouteA/hello');
        assert.equal(divRef.textContent, 'Route A: hello');

        await Utils.setLocation('#RouteA/goodbye');
        assert.equal(divRef.textContent, 'Route A: goodbye');

        await Utils.setLocation('#RouteB-alt');
        assert.equal(divRef.textContent, 'Route B');

        await Utils.setLocation('#RouteC');
        assert.equal(divRef.textContent, 'Default Route');

        jsx.dispose();
    });

    it('Basic <route:provider> and navigation using non-hash URLs', async() => {
        Routes.basicApp('/');

        let divRef;
        let router;
        let jsx = Test.jsx(() => <route:provider useHashUrls={ false } ref={ router } as={ route }>
            <div ref={ divRef }>{ route.title }</div>
        </route:provider>);

        assert.equal(divRef.textContent, 'Default Route');

        await Utils.doRouterOperation(() => router.setPath('/RouteB'), router);
        assert.equal(window.location.pathname, '/RouteB');
        assert.equal(divRef.textContent, 'Route B');

        await Utils.doRouterOperation(() => router.setPath('/RouteA/hello'), router);
        assert.equal(window.location.pathname, '/RouteA/hello');
        assert.equal(divRef.textContent, 'Route A: hello');

        await Utils.doRouterOperation(() => router.setPath('/RouteA/goodbye'), router);
        assert.equal(window.location.pathname, '/RouteA/goodbye');
        assert.equal(divRef.textContent, 'Route A: goodbye');

        await Utils.doRouterOperation(() => router.setPath('/RouteB-alt'), router);
        assert.equal(window.location.pathname, '/RouteB-alt');
        assert.equal(divRef.textContent, 'Route B');

        await Utils.doRouterOperation(() => router.setPath('/RouteC'), router);
        assert.equal(window.location.pathname, '/RouteC');
        assert.equal(divRef.textContent, 'Default Route');

        await Utils.doRouterOperation(() => router.setPath('/'), router);
        assert.equal(window.location.pathname, '/');
        assert.equal(divRef.textContent, 'Default Route');

        jsx.dispose();
    });

    it('Basic <route:provider> toggling between hash and non-hash URLs', async() => {
        Routes.basicApp('/');

        class Settings {
            @Observable static useHash = false;
        }

        let divRef;
        let router;
        let jsx = Test.jsx(() => <route:provider useHashUrls={ Settings.useHash } ref={ router } as={ route }>
            <div ref={ divRef }>{ route.title }</div>
        </route:provider>);

        assert.equal(divRef.textContent, 'Default Route');

        await Utils.doRouterOperation(() => router.setPath('/RouteB'), router);
        assert.equal(window.location.pathname, '/RouteB');
        assert.equal(window.location.hash, '');
        assert.equal(divRef.textContent, 'Route B');

        await Utils.doRouterOperation(() => router.setPath('/'), router);
        assert.equal(window.location.pathname, '/');
        assert.equal(window.location.hash, '');
        assert.equal(divRef.textContent, 'Default Route');

        Settings.useHash = true;
        Test.commit();

        await Utils.doRouterOperation(() => router.setPath('/RouteB'), router);
        assert.equal(window.location.pathname, '/');
        assert.equal(window.location.hash, '#/RouteB');
        assert.equal(divRef.textContent, 'Route B');

        await Utils.doRouterOperation(() => router.setPath('/'), router);
        assert.equal(window.location.pathname, '/');
        assert.equal(window.location.hash, '#/');
        assert.equal(divRef.textContent, 'Default Route');

        jsx.dispose();
    });

    it('<route:provider> should give a warning if try to turn off hash urls in a browser that doesn\'t support it', async() => {
        Routes.basicApp('');

        sinon.spy(console, 'warn');

        assert.equal(history.emulate, false, 'Should not be emulating history API');

        history.emulate = true;
        let jsx = Test.jsx(() => <route:provider useHashUrls={ false } />);
        history.emulate = false;

        assert(console.warn.calledWith('Browser does not support history API, so cannot disable hash URLs'), 'Should get a warning if browser doesn\'t support non-hash urls');
        console.warn.restore();

        jsx.dispose();
    });

    it('Nested <route:provider> and navigation using hash URLs', async() => {
        Routes.nestedApp();

        let divRef;
        let jsx = Test.jsx(() => <route:provider as={ route }>
            <div ref={ divRef }>{ route.content }</div>
        </route:provider>);

        assert.equal(divRef.innerHTML, '<div>Default Route</div>');

        await Utils.setLocation('#pages/1/book');
        assert.equal(divRef.innerHTML, '<div>Page 1: book</div>');

        await Utils.setLocation('#pages/2/book');
        assert.equal(divRef.innerHTML, '<div>Page 2: book</div>');

        await Utils.setLocation('#another');
        assert.equal(divRef.innerHTML, '<div>Default Route</div>');

        await Utils.setLocation('#pages/3/book');
        assert.equal(divRef.innerHTML, '<div>Page Not Found</div>');

        jsx.dispose();
    });

    it('<route:provider> should have methods for accessing the current route, going back and forward', async() => {
        Routes.basicApp();

        let router;
        let divRef;
        let jsx = Test.jsx(() => <route:provider as={ route } ref={ router }>
            <div ref={ divRef }>{ route.title }</div>
        </route:provider>);

        assert.equal(divRef.textContent, 'Default Route');

        await Utils.setLocation('#RouteB');
        assert.equal(divRef.textContent, 'Route B');

        await Utils.setLocation('#RouteA/hello');
        assert.equal(divRef.textContent, 'Route A: hello');

        assert.equal(router.currentPath, 'RouteA/hello', 'Should be able to read current path from the router');
        assert.equal(router.currentRoute.title, 'Route A: hello', 'Should be able to access the current route from the router');

        await Utils.doLocationOperation(() => router.back());
        assert.equal(divRef.textContent, 'Route B', 'Should go back to previous route');

        await Utils.doLocationOperation(() => router.forward());
        assert.equal(divRef.textContent, 'Route A: hello', 'Should go forward again to previous route');

        jsx.dispose();
    });

    it('<route:provider> should allow setting and reading state in the browser history API', async() => {
        Routes.basicApp();

        let historyValues = [
            'testdata',
            { a: 'testobject' }
        ];
        let historyIds = [];

        let router;
        let divRef;
        let jsx = Test.jsx(() => <route:provider as={ route } ref={ router }>
            <div ref={ divRef }>{ route.title }</div>
        </route:provider>);

        assert.equal(divRef.textContent, 'Default Route');

        assert(router.historyId, 'History id should be defined');
        historyIds.push(router.historyId);
        assert.equal(router.getState(), undefined);
        router.setState(historyValues[0]);
        assert.equal(router.getState(), historyValues[0]);

        assert.equal(divRef.textContent, 'Default Route', 'Should not have changed the route by setting the history data');

        await Utils.setLocation('#RouteB');
        assert.equal(divRef.textContent, 'Route B');

        assert(router.historyId, 'History id should still be defined');
        assert.notEqual(router.historyId, historyIds[0], 'History id should be different after page changed');
        historyIds.push(router.historyId);
        assert.equal(router.getState(), undefined);
        router.setState(historyValues[1]);
        assert.equal(router.getState(), historyValues[1]);

        await Utils.doLocationOperation(() => router.back());
        assert.equal(divRef.textContent, 'Default Route', 'Should go back to previous route');
        assert.equal(router.getState(), historyValues[0], 'Should have previous history data');
        assert.equal(router.historyId, historyIds[0], 'Should have previous history id');

        await Utils.doLocationOperation(() => router.forward());
        assert.equal(divRef.textContent, 'Route B', 'Should go forward again to previous route');
        assert.equal(router.getState().a, historyValues[1].a, 'Should have subsequent history data');
        assert.equal(router.historyId, historyIds[1], 'Should have subsequent history id');

        jsx.dispose();
    });

    it('<route:provider> should give a warning if no matching route', async() => {

        sinon.spy(console, 'warn');

        let jsx = Test.jsx(() => <route:provider as={ route }>
            <div>{ route.title }</div>
        </route:provider>);

        assert(console.warn.calledWith('No match for path  - make sure you specify a default route'), 'Should get a warning when no matching path');
        console.warn.restore();
        jsx.dispose();
    });

    it('<route:provider> should provide access to scope from wrapped providers', async() => {

        let divRef;

        @Component
        class MyComponent {
            render() {
                return <div ref={ divRef }>{ this.scope.scopeValue }</div>;
            }
        }

        @Route('$default')
        class MyRoute {
            get view() {
                return <MyComponent/>;
            }
        }
        assert(MyRoute);

        @Component({ fork: true })
        class MyProvider {
            render() {
                this.scope.scopeValue = 'my provided value';
                return this.children;
            }
        }

        let jsx = Test.jsx(() => <MyProvider>
            <route:provider as={ route }>
                { route.view }
            </route:provider>
        </MyProvider>);

        assert.equal(divRef.textContent, 'my provided value');

        jsx.dispose();
    });

    it('<route:provider> should update params and query params when they change', async() => {

        let divRef1, divRef2;
        let componentRef;

        @Component
        class MyComponent {
            @Attribute id;
            @Attribute test;

            render() {
                return <g>
                    <div ref={ divRef1 }>{ this.id }</div>
                    <div ref={ divRef2 }>{ this.test }</div>
                </g>;
            }
        }

        @Route('/page/:id')
        class MyRoute {
            get view() {
                return <MyComponent ref={ componentRef } id={ this.id } test={ this.queryParams.test }/>;
            }
        }
        assert(MyRoute);

        let jsx = Test.jsx(() => <route:provider as={ route }>
            { route.view }
        </route:provider>);

        await Utils.setLocation('#/page/myid?test=myparam');
        assert.equal(divRef1.textContent, 'myid');
        assert.equal(divRef2.textContent, 'myparam');

        let previousComponentRef = componentRef;

        await Utils.setLocation('#/page/anotherid?test=anotherparam');
        assert.equal(previousComponentRef, componentRef, 'The same component should be updated');
        assert.equal(divRef1.textContent, 'anotherid');
        assert.equal(divRef2.textContent, 'anotherparam');

        jsx.dispose();
    });

    it('Aborting route transitions: transitioning via browser events', async() => {
        Routes.basicApp();

        let changes = [];
        let abort = false;

        let handleChange = function(ev) {
            assert(ev instanceof RouteChangeEvent);
            changes.push(ev.oldPath + ' -> ' + ev.newPath);
            if (abort) {
                ev.abort();
            }
        };

        let divRef;
        let jsx = Test.jsx(() => <route:provider as={ route } onChange={ ev => handleChange(ev) } >
            <div ref={ divRef }>{ route.title }</div>
        </route:provider>);

        assert.equal(divRef.textContent, 'Default Route');

        await Utils.setLocation('#RouteB');
        assert.equal(divRef.textContent, 'Route B');

        await Utils.setLocation('#RouteA/hello');
        assert.equal(divRef.textContent, 'Route A: hello');

        abort = true;
        await Utils.setLocation('#RouteA/helloagain');
        assert.equal(window.location.hash, '#RouteA/hello', 'Route change to #RouteA/helloagain should be aborted in browser');
        assert.equal(divRef.textContent, 'Route A: hello', 'Route change to #RouteA/helloagain should be aborted in router');

        abort = false;
        await Utils.setLocation('#RouteB');
        assert.equal(divRef.textContent, 'Route B');

        abort = true;
        await Utils.setLocation('#RouteA/secondabort');
        assert.equal(window.location.hash, '#RouteB', 'Route change to #RouteA/secondabort should be aborted in browser');
        assert.equal(divRef.textContent, 'Route B', 'Route change to #RouteA/secondabort should be aborted in router');

        abort = true;
        await Utils.setLocation('#RouteA/thirdabort');
        assert.equal(window.location.hash, '#RouteB', 'Route change to #RouteA/thirdabort should be aborted in browser');
        assert.equal(divRef.textContent, 'Route B', 'Route change to #RouteA/thirdabort should be aborted in router');

        // Since we aborted twice, we don't know for certain that going "back" is safe, so we end up with a duplicate on the history
        // stack (but the aborted route should never appear). It would be nice to fix this if there's a clean way to do so.
        abort = false;
        await Utils.doLocationOperation(() => window.history.back());
        assert.equal(divRef.textContent, 'Route B', 'Go back: 1');

        await Utils.doLocationOperation(() => window.history.back());
        assert.equal(divRef.textContent, 'Route A: hello', 'Go back: 2');

        await Utils.doLocationOperation(() => window.history.back());
        assert.equal(divRef.textContent, 'Route B', 'Go back: 3');

        await Utils.doLocationOperation(() => window.history.back());
        assert.equal(divRef.textContent, 'Default Route', 'Go back: 4');

        assert.equal(changes.join('\n'), [
            'undefined -> ',
            ' -> RouteB',
            'RouteB -> RouteA/hello',
            'RouteA/hello -> RouteA/helloagain',
            'RouteA/hello -> RouteB',
            'RouteB -> RouteA/secondabort',
            'RouteB -> RouteA/thirdabort',
            'RouteB -> RouteA/hello',
            'RouteA/hello -> RouteB',
            'RouteB -> '
        ].join('\n'));

        jsx.dispose();
    });

    it('Aborting route transitions: transitioning via router events', async() => {
        Routes.basicApp();

        let changes = [];
        let abort = false;

        let handleChange = function(ev) {
            assert(ev instanceof RouteChangeEvent);
            changes.push(ev.oldPath + ' -> ' + ev.newPath);
            if (abort) {
                ev.abort();
            }
        };

        let router;
        let divRef;
        let jsx = Test.jsx(() => <route:provider as={ route } onChange={ ev => handleChange(ev) } ref={ router } >
            <div ref={ divRef }>{ route.title }</div>
        </route:provider>);

        assert.equal(divRef.textContent, 'Default Route');

        await Utils.doRouterOperation(() => router.setPath('RouteB'), router);
        assert.equal(divRef.textContent, 'Route B');

        await Utils.doRouterOperation(() => router.setPath('RouteA/hello'), router);
        assert.equal(divRef.textContent, 'Route A: hello');

        abort = true;
        await Utils.doLocationOperation(() => router.setPath('RouteA/helloagain'));
        assert.equal(window.location.hash, '#RouteA/hello', 'Route change to #RouteA/helloagain should be aborted in browser');
        assert.equal(divRef.textContent, 'Route A: hello', 'Route change to #RouteA/helloagain should be aborted in router');

        abort = false;
        await Utils.doRouterOperation(() => router.setPath('RouteB'), router);
        assert.equal(divRef.textContent, 'Route B');

        abort = true;
        await Utils.doLocationOperation(() => router.setPath('RouteA/secondabort'), router);
        assert.equal(window.location.hash, '#RouteB', 'Route change to #RouteA/secondabort should be aborted in browser');
        assert.equal(divRef.textContent, 'Route B', 'Route change to #RouteA/secondabort should be aborted in router');

        abort = true;
        await Utils.doLocationOperation(() => router.setPath('RouteA/thirdabort'), router);
        assert.equal(window.location.hash, '#RouteB', 'Route change to #RouteA/thirdabort should be aborted in browser');
        assert.equal(divRef.textContent, 'Route B', 'Route change to #RouteA/thirdabort should be aborted in router');

        abort = false;
        await Utils.doLocationOperation(() => window.history.back());
        assert.equal(divRef.textContent, 'Route A: hello', 'Go back: 2');

        await Utils.doLocationOperation(() => window.history.back());
        assert.equal(divRef.textContent, 'Route B', 'Go back: 3');

        await Utils.doLocationOperation(() => window.history.back());
        assert.equal(divRef.textContent, 'Default Route', 'Go back: 4');

        assert.equal(changes.join('\n'), [
            'undefined -> ',
            ' -> RouteB',
            'RouteB -> RouteA/hello',
            'RouteA/hello -> RouteA/helloagain',
            'RouteA/hello -> RouteB',
            'RouteB -> RouteA/secondabort',
            'RouteB -> RouteA/thirdabort',
            'RouteB -> RouteA/hello',
            'RouteA/hello -> RouteB',
            'RouteB -> '
        ].join('\n'));

        jsx.dispose();
    });

    it('Redirecting route transitions: transitioning via browser events', async() => {
        Routes.basicApp();

        let changes = [];
        let redirectPath;

        let handleChange = function(ev) {
            assert(ev instanceof RouteChangeEvent);
            changes.push(ev.oldPath + ' -> ' + ev.newPath);
            if (redirectPath) {
                ev.redirect(redirectPath);
            }
        };

        let divRef;
        let jsx = Test.jsx(() => <route:provider as={ route } onChange={ ev => handleChange(ev) } >
            <div ref={ divRef }>{ route.title }</div>
        </route:provider>);

        assert.equal(divRef.textContent, 'Default Route');

        await Utils.setLocation('#RouteB');
        assert.equal(divRef.textContent, 'Route B');

        await Utils.setLocation('#RouteA/hello');
        assert.equal(divRef.textContent, 'Route A: hello');

        redirectPath = 'RouteA/redirected';
        await Utils.setLocation('#RouteA/helloagain');
        assert.equal(window.location.hash, '#RouteA/redirected', 'Route change to #RouteA/helloagain should be redirected in browser');
        assert.equal(divRef.textContent, 'Route A: redirected', 'Route change to #RouteA/helloagain should be redirected in router');

        redirectPath = undefined;
        await Utils.setLocation('#RouteB');
        assert.equal(divRef.textContent, 'Route B');

        redirectPath = 'RouteA/redirectedagain';
        await Utils.setLocation('#RouteA/secondredirect');
        assert.equal(window.location.hash, '#RouteA/redirectedagain', 'Route change to #RouteA/secondredirect should be redirected in browser');
        assert.equal(divRef.textContent, 'Route A: redirectedagain', 'Route change to #RouteA/secondredirect should be redirected in router');

        redirectPath = undefined;

        await Utils.doLocationOperation(() => window.history.back());
        assert.equal(divRef.textContent, 'Route B', 'Go back: 1');

        await Utils.doLocationOperation(() => window.history.back());
        assert.equal(divRef.textContent, 'Route A: redirected', 'Go back: 2');

        await Utils.doLocationOperation(() => window.history.back());
        assert.equal(divRef.textContent, 'Route A: hello', 'Go back: 3');

        await Utils.doLocationOperation(() => window.history.back());
        assert.equal(divRef.textContent, 'Route B', 'Go back: 4');

        await Utils.doLocationOperation(() => window.history.back());
        assert.equal(divRef.textContent, 'Default Route', 'Go back: 5');

        assert.equal(changes.join('\n'), [
            'undefined -> ',
            ' -> RouteB',
            'RouteB -> RouteA/hello',
            'RouteA/hello -> RouteA/helloagain',
            'RouteA/redirected -> RouteB',
            'RouteB -> RouteA/secondredirect',
            'RouteA/redirectedagain -> RouteB',
            'RouteB -> RouteA/redirected',
            'RouteA/redirected -> RouteA/hello',
            'RouteA/hello -> RouteB',
            'RouteB -> '
        ].join('\n'));

        jsx.dispose();
    });

});
