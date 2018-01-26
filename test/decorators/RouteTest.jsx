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

describe('@Route', () => {

    beforeEach(() => {
        // Make sure that we clear the routes and the path before each test
        Routes.clear();
        window.location.href = '#';
    });

    // XXX: Reenable when https://github.com/facebook/react/issues/10474 is fixed.
    it.skip('@Route requires an argument', () => {

        let test = () => {
            @Route
            class RouteA {
            }
            assert(RouteA);
        };

        assert.throws(test, Error, 'Using @Route without an argument should give an error');
    });

    it('Basic use of @Route to register routes', () => {

        @Route('$default')
        @Route('test/:name')
        class RouteA {
        }
        assert(RouteA);

        @Route('another/:a/:b')
        class RouteB {
        }
        assert(RouteB);

        @Route('my-namespace', 'another/:a/:b/:c')
        class RouteC {
        }
        assert(RouteC);

        assert.equal(Routes.print(), [
            '$default -> RouteA',
            'test/:name -> RouteA',
            'another/:a/:b -> RouteB',
            '[my-namespace] another/:a/:b/:c -> RouteC'
        ].join('\n'));

        // Can clear just the routes for a given namespace
        Routes.clear('my-namespace');

        @Route('my-namespace', '$default')
        class RouteD {
        }
        assert(RouteD);

        assert.equal(Routes.print(), [
            '$default -> RouteA',
            'test/:name -> RouteA',
            'another/:a/:b -> RouteB',
            '[my-namespace] $default -> RouteD'
        ].join('\n'));
    });

    it('Should get warning if more than one default route', () => {

        sinon.spy(console, 'warn');

        @Route('$default')
        class RouteA {
        }
        assert(RouteA);

        @Route('$default')
        class RouteB {
        }
        assert(RouteB);

        assert(console.warn.calledWith('There is already a default route ($default) - this will override the previous default route'), 'Should get a warning when define more than one default route');
        console.warn.restore();
    });

    it('Should get warning if more than one route matches a path', async() => {

        sinon.spy(console, 'warn');

        @Route('$default')
        @Route('/path')
        class RouteA {
            get name() {
                return 'RouteA';
            }
        }
        assert(RouteA);

        @Route('/path')
        class RouteB {
            get name() {
                return 'RouteB';
            }
        }
        assert(RouteB);

        var divRef;
        var jsx = Test.jsx(() => <route:provider as={ route }>
            <div ref={ divRef }>{ route.name }</div>
        </route:provider>);

        await Utils.setLocation('#/path');
        assert.equal(divRef.textContent, 'RouteB', 'When multiple routes match, last route to be defined should win');

        assert(console.warn.calledWith('More than one match for path /path - this will override the previous match'), 'Should get a warning when more than one route matches a path');
        console.warn.restore();

        jsx.dispose();
    });

    it('Route should have access to scope, query parameters and named parameters', async() => {
        var enterRecord = '';

        @Route('$default')
        class Default {
            enter() {
                enterRecord += 'Default;';
                assert.equal(this.scope, this.router.scope, 'Scope on route should match router');
                assert.equal(this.currentPath, '');
                assert.equal(JSON.stringify(this.queryParams), JSON.stringify({}));
            }
        }
        assert(Default);

        @Route('/page/:id/:path*')
        class Page {
            enter() {
                enterRecord += 'Page;';
                assert.equal(this.scope, this.router.scope, 'Scope on route should match router');
                assert.equal(this.currentPath, '/page/2/a/b/c');
                assert.equal(this.id, '2');
                assert.equal(this.path, 'a/b/c');
                assert.equal(JSON.stringify(this.queryParams), JSON.stringify({ a: '1', b: '2' }));
            }
        }
        assert(Page);

        var jsx = Test.jsx(() => <route:provider />);

        await Utils.setLocation('#/page/2/a/b/c?a=1&b=2');

        assert.equal(enterRecord, 'Default;Page;', 'All routes should have been visited');

        jsx.dispose();
    });

    it('Should be able to enter and exit route', async() => {

        var onEnter = sinon.spy();
        var onLeave = sinon.spy();

        @Route('$default')
        class RouteA {
            enter() {
                onEnter('RouteA: ' + this.currentPath);
            }

            leave() {
                onLeave('RouteA: ' + this.currentPath);
            }
        }
        assert(RouteA);

        @Route('/routeB/:id')
        class RouteB {
            enter() {
                onEnter('RouteB: ' + this.currentPath);
            }

            leave() {
                onLeave('RouteB: ' + this.currentPath);
            }
        }
        assert(RouteB);

        @Route('mynamespace', '$default')
        class RouteC {
            enter() {
                onEnter('RouteC: ' + this.currentPath);
            }

            leave() {
                onLeave('RouteC: ' + this.currentPath);
            }
        }
        assert(RouteC);

        var jsx = Test.jsx(() => <route:provider></route:provider>);

        assert.equal(onEnter.callCount, 1, 'Should enter default -> RouteA');
        assert.equal(onLeave.callCount, 0, 'Should not leave any routes');
        assert(onEnter.calledWith('RouteA: '));
        onEnter.reset();

        await Utils.setLocation('#/routeB/1');

        assert.equal(onEnter.callCount, 1, 'Should enter RouteA -> RouteB');
        assert.equal(onLeave.callCount, 1, 'Should leave RouteA');
        assert(onLeave.calledWith('RouteA: /routeB/1'));
        assert(onEnter.calledWith('RouteB: /routeB/1'));
        onEnter.reset();
        onLeave.reset();

        await Utils.setLocation('#/routeB/2');

        assert.equal(onEnter.callCount, 0, 'Should not enter any routes when only parameters change');
        assert.equal(onLeave.callCount, 0, 'Should not leave any routes when only parameters change');

        await Utils.setLocation('#/routeA');

        assert.equal(onEnter.callCount, 1, 'Should enter RouteB -> RouteA');
        assert.equal(onLeave.callCount, 1, 'Should leave RouteB');
        assert(onLeave.calledWith('RouteB: /routeA'));
        assert(onEnter.calledWith('RouteA: /routeA'));
        onEnter.reset();
        onLeave.reset();

        jsx.dispose();
    });

    it('Should always exit and enter route, if forceReload', async() => {

        var onEnter = sinon.spy();
        var onLeave = sinon.spy();

        @Route('$default')
        class RouteA {
        }
        assert(RouteA);

        @Route('/routeB/:id')
        class RouteB {
            enter() {
                onEnter('RouteB: ' + this.currentPath);
            }

            leave() {
                onLeave('RouteB: ' + this.currentPath);
            }
        }
        assert(RouteB);

        var jsx = Test.jsx(() => <route:provider forceReload={ true }></route:provider>);

        await Utils.setLocation('#/routeB/1');

        assert.equal(onEnter.callCount, 1, 'Should enter RouteA -> RouteB');
        assert(onEnter.calledWith('RouteB: /routeB/1'));
        onEnter.reset();

        await Utils.setLocation('#/routeB/2');

        assert.equal(onEnter.callCount, 1, 'Should enter RouteB -> RouteB');
        assert.equal(onLeave.callCount, 1, 'Should leave RouteB -> RouteB');
        assert(onLeave.calledWith('RouteB: /routeB/2'));
        assert(onEnter.calledWith('RouteB: /routeB/2'));
        onEnter.reset();
        onLeave.reset();

        jsx.dispose();
    });

});
