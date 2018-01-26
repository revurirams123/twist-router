import { SignalDispatcher } from '@twist/core';

export default class BaseRoute extends SignalDispatcher {

    constructor(router, keys, values) {
        super();

        this.router = router;
        this._keys = keys;

        for (let i = 0; i < keys.length; i++) {
            this.defineObservable(keys[i].name, values[i]);
        }
    }

    get scope() {
        return this.router.scope;
    }

    get currentPath() {
        return this.router.currentPath;
    }

    get queryParams() {
        return this.router.queryParams;
    }

    /**
     * Override this to hook into when we enter the route
     */
    enter() {
    }

    /**
     * Override this to hook into when we leave the route (i.e. switching to another route)
     * Note that if only the parameters change, this won't get called - instead, you can just watch the parameters
     */
    leave() {
    }
}
