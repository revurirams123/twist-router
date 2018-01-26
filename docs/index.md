# Twist Router (@twist/router)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Overview](#overview)
- [Managing Routes](#managing-routes)
- [Defining Routes](#defining-routes)
- [Changing Routes](#changing-routes)
- [Intercepting Route Changes](#intercepting-route-changes)
  - [Aborting](#aborting)
  - [Redirecting](#redirecting)
- [Nested Routers](#nested-routers)
- [Relationship with Twist](#relationship-with-twist)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Overview

The [@twist/router](https://github.com/adobe/twist-router) library provides client-side routing for Twist applications. This lets you manage page transitions in your application, and tie these to changes in the URL. It's based on the browser [History API](https://developer.mozilla.org/en-US/docs/Web/API/History), and comes with a polyfill in case it's not supported.

## Managing Routes

To get started with twist-router, you add a `<route:provider>` component to your application. This gives you access to the current route that's active, and you can access any methods/properties on the route instance (see [Defining Routes](#defining-routes) for more details). Here's an example of a top-level application with a route provider:

```jsx
import ReactDOM from "react-dom";

@Component
export default class App {
    render() {
        return <route:provider as={ route }>
            <h1>{ route.title }</h1>
            { route.view }
        </route:provider>;
    }
}

ReactDOM.render(<App />, document.body);
```

You can specify whether or not to use hash URLs via the `useHashUrls` attribute. By default, hash URLs will be used:

* Hash URLs (e.g. `http://myapp.com/#path/to/page`) store the client-side path in the hash portion of the URL - this is never passed to the server. Changes to just the hash portion of the URL do not cause the browser to contact the server, meaning that even normal `<a>` links can be handled purely on the client side.
* Non-hash URLs (e.g. `http://myapp.com/path/to/page`) do not distinguish between the server-side and client-side portion of the URL. This means that both the server _and_ the client need to know how to serve the given path. Normal `<a>` links that change the URL will result in a call to the server, so path changes _must_ go through the browser's history API to prevent this (see [Changing Routes](#changing-routes)).

Both approaches allow users to bookmark pages. Non-hash URLs are typically preferred if you need server-side rendering, in which case the server needs to know what path you're asking for, to correctly render the initial page contents. If you don't need server-side rendering, then hash URLs are simpler to use, and compatible with more browsers.


## Defining Routes

In twist-router, routes are classes that are decorated with the `@Route` decorator. `@Route` takes a string as a parameter that defines the path for the route. This is a regular expression of the type used by [express](https://expressjs.com/en/guide/routing.html) - you can see the documentation there for everything you can do, including how to capture parameters from the path. Here are some simple examples:

* Match an exact path: `@Route('pages/intro')`
* Match a path based on a string pattern: `@Route('pages/intro(duction)?')`
* Match a path with a parameter: `@Route('pages/:id')` (matches `'pages/2'` but not `'pages/2/3'`)
* Match a path with multiple parameters: `@Route('pages/:id*')` (matches `'pages/2'` and `'pages/2/3'`)
* Match the default route (fallback if no other route matches the given path): `@Route('$default')`.

When a route is matched, an instance of the corresponding class is created. The following properties will be available automatically:

* Path parameters by name: e.g. for `@Route('profile/:id')`, you can access `this.id` to get the value of the `:id` parameter.
* Query parameters via `this.queryParams`: e.g. for the path `profile/12345?display=list`, `this.queryParams` will be `{ display: 'list' }`.
* The current path via `this.currentPath`: Note that this doesn't include any query parameters.
* The route provider via `this.router` (see [Managing Routes](#managing-routes)).

You can also override the methods `enter` and `leave` to do something when we enter/leave the route. By default, if a path change continues to match the same `@Route` decorator (e.g. changing `profile/1234` to `profile/5678`, which both match `@Route('profile/:id')`), then the same route will continue to run. Its path and query parameters will be updated (they're all observable), and `enter`/`leave` will not be called. If you want the route to always be destroyed/recreated, you can pass in `forceReload={ true }` to `<route:provider>`.

Here's an example:

```javascript
@Route('profile/:id')
class ProfileRoute {

    get title() {
        return 'Profile';
    }

    get view() {
        return <ProfileView id={ this.id } display={ this.queryParams.display } />;
    }

    enter() {
        // Do something at the time the route is entered
    }

    leave() {
        // Do something before the route is disposed (i.e. we're switching to another route)
    }
}
```

Note that the same class can have multiple `@Route` decorators - for example, if you want to associate multiple paths in to the same view. However, routes must be non-overlapping - if multiple routes match a given path, the last one will be selected, and you'll see a warning in the console. If you need to have multiple routers in your application, e.g. for sub-views, see the section on [Nested Routers](#nested-routers).


## Changing Routes

There are a number of different ways to change the current route of the page:

1. Use a `<route:link>` component - this is basically the same as an `<a href="...">` tag (you use it like `<route:link to="...">`), but it works with both hash and non-hash URLs.
2. Modify the route programmatically, via `router.setPath(newPath)`, `router.back()`, `router.forward()`. You can access the `router` via the scope of any child components of the route provider (it's available as `this.scope.router`), or by obtaining a reference (e.g. `<route:provider ref={ this.router }>`).
3. Directly change the `window.location` - this can be done via links (`<a href="...">`), or modifying `window.location` programmatically. Note however that if you're using non-hash URLs, then this will force a page refresh, because it didn't go through the browser's `history` API.

We recommend using `<route:link>` rather than `<a>`, because it's compatible with both hash and non-hash URLs.


## Intercepting Route Changes

When a route changes, the sequence of events is as follows:

1. The _path_ changes in the browser (`window.location`). This can be due to clicking on a link in the page, or the user clicking the forward/back buttons or manually modifying the URL.
2. The `<route:provider>` triggers a `change` event, with the old and the new path.
3. The `<route:provider>` matches the route to load, based on the new path, and instantiates it, or updates its parameters if it's the same route (use `<route:provider forceReload={ true }/>` if you want to always force a route to be unloaded and then reloaded).

If you need to intercept the route change, you can do so via an `on-change` event handler. This provides methods for aborting or redirecting the change.

### Aborting

Aborting is very useful if you want to prevent the user from leaving a page - for example, if it has unsaved changes. Here's an example of how this works:

```javascript
class MainApplication extends Application {

    leave(doLeave) {
        this.showLeaveWarning = false;
        if (doLeave) {
            this.router.setPath(this.leavePath);
        }
    }

    onChange(ev) {
        if (this.router.currentRoute && this.router.currentRoute.hasUnsavedChanges) {
            // Pop open a warning dialog:
            this.showLeaveWarning = true;
            // Remember the path we were trying to change to (so we can direct there if the user clicks OK):
            this.leavePath = ev.newPath;
            // Abort the path change (going back to the previous path):
            ev.abort();
        }
    }

    render() {
        return <route:provider ref={ this.router } as={ page } on-change={ ev => this.onChange(ev) }>
            { page.view }
            <if condition={ this.showLeaveWarning }>
                <LeaveWarningDialog on-ok={ this.leave(true) } on-cancel={ this.leave(false) } />
            </if>
        </route:provider>;
    }
}
```

Notice that we've obtained a reference to the `<route:provider>`, so we can call `router.setPath()` if the user decides they _do_ want to leave the page after all (for example, losing their changes). `router.currentRoute` is the same object that you access in JSX via `<route:provider as={ currentRoute }>`.

### Redirecting

Redirecting is useful for handling things like authentication - where you want to direct the user to a login page if they're not already logged in. Here's an example of how this works:

```javascript
class MainApplication extends Application {

    isLoggedIn() {
        // Check if the user is logged in
    }

    onChange(ev) {
        if (!this.isLoggedIn()) {
            // Redirect to login page if the user isn't logged in
            ev.redirect('/login?redirect=' + encodeURIComponent(ev.newPath));
            return;
        }

        if (ev.newPath.startsWith('/login')) {
            // If the user is already logged in, and they're trying to access the login page, send them to the home page instead
            ev.redirect('/');
            return;
        }
    }

    render() {
        return <route:provider as={ page } on-change={ ev => this.onChange(ev) }>
            { page.view }
        </route:provider>;
    }
}
```


## Nested Routers

Let's say you have a complex application that consists of a hierarchy of views. You have a top-level route provider that deals with the high-level routing, but then you want to have a frame in the application that also updates _its_ content when the path changes. You'll have noticed that `@Route` classes are global, and you can't have overlapping routes, so how can you do this with twist-router?

The answer is that routes can be *namespaced*. This allows you to have multiple sets of overlapping routes that correspond to different route providers, and you can nest those providers. You simply provide a namespace as the first parameter to `@Route`, and reference this in the provider, via `<route:provider namespace="...">`. Here's an example where an `@Route` has its own `<route:provider>` for handling sub-routes:

```javascript
@Route('/products/*')
class ProductPage {

    get view() {
        return <g>
            <h1>Product View</h1>
            <route:provider namespace="products" as={ product }>
                <h2>{ product.header }</h2>
                <div>{ product.contents }</div>
            </route:provider>
        </g>
    }
}

@Route('products', '/products/new/:id')
class NewProductPage {
    get header() {
        return '[New] ' + lookupName(this.id);
    }
    ...
}

@Route('products', '/products/old/:id')
class OldProductPage {
    get header() {
        return '[Refurbished] ' + lookupName(this.id);
    }
    ...
}
```

This is particularly useful when you're integrating components into a larger application, and they need to be able to manage their own routing.


## Storing State in the Browser History

Sometimes, you need to associate some data with an entry in the browser's history, so that you can recover it when the user navigates via the back and forward buttons. For example, if you have some information about the view state that you want to remember, it's possible to store it here. You should only use this for data that's truly transient - in other words, anything you store here will be lost if the user copies and pastes the URL of the current page.

To read and write data to the browser's history, use the following APIs (`data` can be an object):

```javascript
// Store some data on the current browser history entry:
router.setState(data);

// Read that data back:
var data = router.getState();
```

Note that this is global - multiple calls to `setState` will override the previous stored value. It's a good idea to only do this in the top-level `<route:provider>`, and create APIs for merging multiple sources of data together, if there are multiple parts of the application that need to store data here.

Alternatively, if you just want to associate a unique id with each entry in the browser history (so that you can store some state somewhere else), you can just access the following API:

```javascript
// Get a unique identifier corresponding to the entry in the browser's history stack:
var id = router.historyId;
```

This latter method is better if you want to remember some data _just before_ a path change happens - for example, remembering the scroll position of the page. Because the path change can happen externally (i.e. the user modifies the URL or hits the forward or back buttons), there's no way to intercept this _before_ the path changes - the history entry will have already been changed by the time this happens. In this case, you can keep your own data map, from the `router.historyId` to the data - so that you can store and recover it when the path changes. Here's an example:

```javascript
let historyMap = {};

this.watch(() => this.scope.router.historyId, historyId => {
    if (this._historyId) {
        // Save the current view state, such as the scroll position:
        historyMap[this._historyId] = this.getViewState();
    }
    if (historyMap[historyId]) {
        // Load the new view state, such as setting the scroll position:
        this.setViewState(historyMap[historyId])
    }
    this._historyId = historyId;
});
```

## Relationship with Twist

Twist Router and [Twist](https://github.com/adobe/twist) work really well together, but they serve orthogonal purposes. Think of your application as a house with multiple windows. As you walk around the house, you can look inside different windows, to get a different view of what's going on inside.

* Twist manages the _model_ of your application - it's like the contents of the house. The contents change over time, but they're the same regardless of which window you're peeking through. Just because you can't see the kitchen from the living room, doesn't mean it doesn't exist!
* Twist Router manages the _current view_ of the model that your application is presenting -- it's like the window you're looking through.

An important distinction is that the state of the router is always contained in the URL, but the internal model is not. That means that you have to store the state somewhere (e.g. in a database), so that when a user logs in, they can recover their state (e.g. by calling a REST API that connects to the database). To recover the view though, you just need to provide the same URL -- e.g. the user can bookmark the URL to remember what they were looking at last.
