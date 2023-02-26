# MicroEnd

### MicroEnd WebApp provides offline-first micro-frontends for modular applications.

MicroEnd is a WebComponent that functions as a router within a web application. Team members with diverse skill sets (
react, angular, vue, svelte, etc.) can construct large web applications that are modular and support offline
functionality. MicroEnd provides life-cycle and inter-module communication for large web applications.

It is difficult to create large web applications, especially when an offline modular mechanism is required. Offline
modular signifies that new modules can be installed in your web application even when it is not connected to a network
or the internet. Because MicroEnd application is a web application, it can run on any platform or device that already
contains a browser.

What MicroEnd does is straightforward.
MicroEnd comprises the **MicroEnd App (MEAP)** and the **MicroeEnd Module (MEMO)**.

### MicroEnd App

In MicroEnd App (MEAP), a `microend-router` web component, serves to navigate between modules (MEMO), invoke the
module's lifecycle, and facilitate communication between modules. MEAP application is extremely small, consisting of
only one HTML page that is less than 50kb.
The small file size makes it simple for users to access this HTML file offline using a web browser.
In addition to a `microend-router`, the MEAP includes a `microend-module-loader`. `microend-module-loader` is a web
component that installs MicroEnd MODULE (MEMO); the modules installed by `microend-module-loader` are then stored in the
IndexDB local database. IndexDB database is a database that is accessible on all devices in browsers.

### MicroEnd Module

MicroEnd Modules are web applications that can be developed with your preferred JavaScript framework. You may utilize
React, Vue, Svelte, Lit, or plain typescript. When you create a module, you can listen to its lifecycle using
the `microend` object or the `me` object, both of which are accessible via the object window. Only when your module has
been installed into the MicroEnd App will events such as `onMount`, `onFocusChange`, and `onParamsChange` be called.

Imagine you are developing a shopping cart and payment module for an e-commerce application. The Shopping Cart module
contains a list of items the user will checkout, whereas the Payment Module contains a checkout function that accepts
the total amount of items to be paid for.

Using the microend object's `navigateTo` method, you can call the payment module from the shopping cart module.
The `navigateTo` function requires two parameters: the module's name and the parameter to pass to it.
The `navigateTo` function returns a promise containing the payment module's return value (whether the transaction was
successful or failed).

You can listen for the `onMount` event and the parameters provided by the shopping cart module in the payment module.
When a module is called by another module (payment module), its life is typically ephemeral, meaning it will be mounted
to the dom when called and unmounted from the dom after `navigateBack`.

Nonetheless, we can keep a module mounted in the browser even if it calls `navigateBack`. If this module is called
again, the `onFocusChange` and `onParamsChange` lifecycles will be invoked, along with any parameter changes. To return
to the calling module, `navigateBack` can be used.