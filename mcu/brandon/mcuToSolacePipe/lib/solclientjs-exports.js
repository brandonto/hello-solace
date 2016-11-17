////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Solace Systems Messaging API for JavaScript
// Copyright 2010-2016 Solace Systems, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to use
// and copy the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// UNLESS STATED ELSEWHERE BETWEEN YOU AND SOLACE SYSTEMS, INC., THE SOFTWARE
// IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR
// A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
// IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// http://www.SolaceSystems.com
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var loader = function() {
    var loaded = {
        debug: null,
        full: null,
        production: null
    };
    var load = function(type, file) {
        if (loaded[type]) return loaded[type];

        loaded[type] = require(file);
        return loaded[type];
    };
    var loadDebug = function() {
        return load("debug", "./solclientjs-debug.js");
    };
    var loadFull = function() {
        return load("full", "./solclientjs-full.js");
    };
    var loadProduction = function() {
        return load("production", "./solclientjs.js");
    };

	var publicAPI = loadProduction();
	Object.defineProperty(publicAPI, 'debug', {
        get: function() {
            return loadDebug()
        }
    });
	Object.defineProperty(publicAPI, 'full', {
        get: function() {
            return loadFull();
        }
    });
	Object.defineProperty(publicAPI, 'release', {
        get: function() {
            return loadProduction();
        }
    });
	Object.defineProperty(publicAPI, 'production', {
        get: function() {
            return loadProduction();
        }
    });

	return publicAPI;
}

module.exports = new loader();
