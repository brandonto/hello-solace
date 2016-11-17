///////////////////////////////////////////////////////////////////////////////
//
// This file has been modified by Solace Systems, Inc. Those modifications are
// licensed under the following terms:
//
// Solace Systems Messaging API for JavaScript
// Copyright 2013-2016 Solace Systems, Inc.
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
// The original license for the file:
//
// Copyright 2013 Mikeal Rogers, Timm Preetz
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
///////////////////////////////////////////////////////////////////////////////

var util = require('util')
    , Agent = require('http').Agent
    , net = require('net')
    , tls = require('tls')
    , AgentSSL = require('https').Agent;

function EternalAgent(options) {
    Agent.call(this, options);

    var self = this;
    self.freeSockets = {};
    self.minSockets = self.options.minSockets || EternalAgent.defaultMinSockets;
    self.socketIdleTimeoutMs = self.options.socketIdleTimeoutMs || EternalAgent.defaultSocketIdleTimeoutMs;

    self.removeAllListeners('free');
    self.on('free', function(socket, host, port) {
        if (self.isSocketOpen(socket)) {
            // A socket has become free.
            var name = host + ':' + port;

            // Service a pending request if there is any.
            if (self.requests[name] && self.requests[name].length > 0) {
               //console.log("=====>EternalAgent: execute queueing request on free socket");
               self.requests[name].shift().onSocket(socket);
            }
            else {
                // Enqueue the free socket.
                this.enqueueFreeSocket(name, socket);
            }
        }
        else {
            //console.log("=====>EternalAgent: socket already closed");
            socket.destroy();
        }
    });

}
util.inherits(EternalAgent, Agent);
exports.EternalAgent = EternalAgent;

EternalAgent.defaultMinSockets = 2;
EternalAgent.defaultSocketIdleTimeoutMs = 10000;

EternalAgent.prototype.isLessThanMinSockets = function(name) {
    var servingSocketNum = this.sockets[name]?this.sockets[name].length:0;
    return servingSocketNum < this.minSockets;
};

EternalAgent.prototype.isSocketOpen = function(socket) {
    return (socket && socket.readyState === 'open');
};

EternalAgent.prototype.enqueueFreeSocket = function(name, socket) {
    // If an error happens while we aren't using the socket, throw it away.
    if (! socket._onIdleError) {
        socket._onIdleError = function() {
            //console.log("=====>EternalAgent: socket error while in idle, destroy");
            socket.destroy();
        };
        socket.on('error', socket._onIdleError);
    }

    // add idle timeout
   if (socket._redundantTimeout) {
        clearTimeout(socket._redundantTimeout);
        socket._redundantTimeout = null;
    }
    // set idle timer
    var self = this;
    socket._redundantTimeout = setTimeout(function() {
        //console.log("=====>EternalAgent: socket idle timeout, destroy");
        socket.destroy();
    }, this.socketIdleTimeoutMs);

    if (!this.freeSockets[name]) this.freeSockets[name] = [];
    this.freeSockets[name].push(socket);
};

EternalAgent.prototype.dequeueFreeSocket = function(name) {
    if (this.freeSockets[name]) {
        var socket;
        do {
            socket =  this.freeSockets[name].shift();
            if (socket) {
                // If this socket was scheduled for destruction, cancel that.
                if (socket._redundantTimeout) {
                    clearTimeout(socket._redundantTimeout);
                    delete socket._redundantTimeout;
                }

                // Remove the idle error listener, if the socket had one.
                if (socket._onIdleError) {
                    socket.removeListener('error', socket._onIdleError);
                    delete socket._onIdleError;
                }

                if (this.isSocketOpen(socket)) {
                    break;
                }
                else {
                    socket.destroy();
                }
            }
        } while (socket);

        if (this.freeSockets[name].length == 0) {
            delete this.freeSockets[name];
        }
        return socket;
    }
    return null;
};

EternalAgent.prototype.addRequest = function(req, host, port) {
    var name = host + ':' + port;
    var socket = null;
    if (this.isLessThanMinSockets(name)) {
        //console.log("=====>EternalAgent: create socket to maintain minSockets");
        socket = this.createSocket(name, host, port);
        req.onSocket(socket);
    }
    else {
        // Try to get a free socket.
        socket = this.dequeueFreeSocket(name);
        if (socket === null) {
            //console.log("=====>EternalAgent: no free socket, create one");
            // There's no free socket.
            if (this.sockets[name] && (this.sockets[name].length >= this.maxSockets)) {
                // queue requests
                //console.log("=====>EternalAgent: queue request, maxSockets reached");
                if (!this.requests[name]) this.requests[name] = [];
                this.requests[name].push(req);
                return;
            }
            socket = this.createSocket(name, host, port);
        }
        req.onSocket(socket);
    }
};

EternalAgent.prototype.removeSocket = function(socket, name, host, port) {
	//console.log("=====>EternalAgent: removing socket " + name);
    if (socket._redundantTimeout) {
        clearTimeout(socket._redundantTimeout);
        delete socket._redundantTimeout;
    }

    // Remove the idle error listener, if the socket had one.
    if (socket._onIdleError) {
        socket.removeListener('error', socket._onIdleError);
        delete socket._onIdleError;
    }

    if (this.sockets[name]) {
        var index = this.sockets[name].indexOf(socket);
        if (index !== -1) {
            this.sockets[name].splice(index, 1);
        }
        if (this.sockets[name].length === 0) {
            // don't leak
            delete this.sockets[name];
            delete this.requests[name];
        }
    }

    if (this.freeSockets[name]) {
        var index = this.freeSockets[name].indexOf(socket);
        if (index !== -1) {
            this.freeSockets[name].splice(index, 1)
        }
        if (this.freeSockets[name].length === 0) {
            delete this.freeSockets[name]
        }
    }
};

function EternalAgentSSL(options) {
    EternalAgent.call(this, options);
    var self = this;
    self.createConnection = createConnectionSSL;
}
util.inherits(EternalAgentSSL, EternalAgent);
exports.EternalAgentSSL = EternalAgentSSL;

function createConnectionSSL(port, host, options) {
    options.port = port;
    options.host = host;
    return tls.connect(options);
}

