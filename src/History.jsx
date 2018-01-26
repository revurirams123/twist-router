import { SignalDispatcher } from '@twist/core';
import './third_party/history';
import query from './third_party/query';

import RouteChangeEvent from './RouteChangeEvent';

const Global = (
    typeof window !== 'undefined' ? window
        : typeof self !== 'undefined' ? self
            : typeof global !== 'undefined' ? global : {}
);

/**
 * History provides a wrapper over the browser history APIs, so that we can listen to and control browser
 * path change events. This emits two events:
 *
 * * change: This is emitted when the path changes, either programmatically, or via a browser event (like the back button)
 *           The data for this event is a RouteChangeEvent object, which can be modified (i.e. to abort or redirect the path change).
 * * commit-change: This is emitted when a path change is finalized, so it can be propagated to the router (actually updating the app).
 *
 * The idea is that users can intercept change events (via a route:provider), so that they can abort
 */
export default class History extends SignalDispatcher {

    @Observable path;
    @Observable queryParams;
    @Observable _currentPageId;

    _userState;
    _statePrefix = Math.random() + '_';
    _nextPageId = 1;

    constructor(useHashUrls) {
        super();
        this.useHashUrls = useHashUrls;

        Global.addEventListener('popstate', this._onBrowserPathChange);
        this.link(() => Global.removeEventListener('popstate', this._onBrowserPathChange));
    }

    init() {
        this._onBrowserPathChange();
    }

    get id() {
        return this._statePrefix + this._currentPageId;
    }

    _createNewPageId() {
        return this._nextPageId++;
    }

    _stateToPageId(evState) {
        if (typeof evState === 'string' && evState.indexOf(this._statePrefix) === 0) {
            return Number(evState.substring(this._statePrefix.length));
        }
    }

    _pageIdToState(pageId) {
        pageId = pageId || this._currentPageId;
        return this._statePrefix + pageId;
    }

    _getHistoryState(pageId) {
        return {
            id: this._pageIdToState(pageId),
            user: this._userState
        };
    }

    /**
     * Get the current path according to the browser
     * @private
     */
    @Bind
    _onBrowserPathChange(ev) {

        const location = Global.history.location || Global.location;
        let newPath = location && (this.useHashUrls ? location.hash : location.pathname) || '';

        // We normalize any browser paths so they don't include the hash
        newPath = newPath.replace(/^#/, '');

        var historyState = ev ? ev.state : Global.history.state;
        var newPageId = this._stateToPageId(historyState && historyState.id);

        if (!newPageId) {
            // If it doesn't have a state, the user must have entered a URL directly
            // We give this a new page id, and replace the browser state so it's in the state!
            newPageId = this._createNewPageId();
            if (location.protocol === 'http:' || location.protocol === 'https:') {
                // History API doesn't work for local files, so only try to do this if we know the file is hosted
                Global.history.replaceState(this._getHistoryState(newPageId), newPath);
            }
        }

        var abortMethod;
        if (newPageId === this._currentPageId - 1) {
            // User clicked the back button
            abortMethod = 'forward';
        }
        else if (newPageId === this._currentPageId + 1) {
            // User clicked the forward button
            abortMethod = 'back';
        }

        this._currentPageId = newPageId;
        this._userState = historyState && historyState.user;

        if (this._ignoreNextPopEvent) {
            this._ignoreNextPopEvent = false;
            return;
        }

        this._updatePath(newPath, true, abortMethod);
    }

    /**
     * Controls whether or not hash urls are used
     * @private
     */
    get useHashUrls() {
        return Global.history.emulate || this._useHashUrls;
    }

    set useHashUrls(useHashes) {
        if (Global.history.emulate && !useHashes) {
            console.warn('Browser does not support history API, so cannot disable hash URLs');
            useHashes = true;
        }
        this._useHashUrls = useHashes;
    }


    _getChangeEvent() {
        return new RouteChangeEvent(this.fullPath, this._previousPath);
    }

    /**
     * Changing the path - this also parses any query strings appended to the path
     * @private
     */
    _updatePath(path, canIntercept, abortMethod) {
        this.fullPath = path;

        if (this.fullPath === this._previousPath) {
            // Nothing changed
            return;
        }

        var index = path.indexOf('?');
        if (index !== -1) {
            this.path = path.substr(0, index);
            this.queryParams = query.parse(path.substr(index + 1));
        }
        else {
            this.path = path;
            this.queryParams = {};
        }

        if (canIntercept) {
            // An onChange handler has the ability to modify this change event, so we need to react to that!
            var event = this._getChangeEvent();
            this.trigger('change', event);

            // If it's an abort, we use the provided method (e.g. back, forward) if there is one
            if (event._operation === RouteChangeEvent.ABORT && abortMethod) {
                // Abort
                this._ignoreNextPopEvent = true;
                this[abortMethod]();
                return;
            }
            // Otherwise for aborts or redirects, we just replace the current path
            if (event._operation === RouteChangeEvent.REDIRECT || (event._operation === RouteChangeEvent.ABORT && !abortMethod)) {
                this.setPath(event.newPath, true);
                return;
            }
        }

        this._previousPath = this.fullPath;
        this.trigger('commit-change');
    }

    _setPath(path, replaceState = false) {
        let hashedPath = this.useHashUrls ? '#' + path : path;

        // We use a pageId as a numerical index - this lets us tell if you go
        // forward or back through a browser event
        this._currentPageId = this._createNewPageId();

        if (replaceState) {
            Global.history.replaceState(this._getHistoryState(), path, hashedPath);
        }
        else {
            Global.history.pushState(this._getHistoryState(), path, hashedPath);
        }
    }

    setPath(path, replaceState) {
        // Update the path in the browser (history API):
        this._setPath(path, replaceState);
        // Update the view - note: we don't allow intercepting of replaceState path changes
        this._updatePath(path, !replaceState, 'back');
    }

    setState(data) {
        this._userState = data;
        // Store the state via the history API:
        Global.history.replaceState(this._getHistoryState(), this.fullPath);
    }

    getState() {
        return this._userState;
    }

    forward() {
        Global.history.forward();
    }

    back() {
        Global.history.back();
    }

}
