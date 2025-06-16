'use strict';

// This package is consumed by Node-RED via the `node-red` field in
// package.json. We purposefully leave this entry file minimal so that the
// module can also be `require`d from user-land JavaScript if needed.
//
// Requiring the module has the side-effect of registering the nodes with
// Node-RED *iff* the runtime exposes the global `RED` object (the mechanism
// used in unit-tests). Otherwise, this file exports an empty object.

module.exports = {};
