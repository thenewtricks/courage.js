//
// connection_manager.js
// courage.js
//
// Copyright (c) 2014 The New Tricks, LLC.
// MIT License.
//

var TheNewTricks = TheNewTricks || {};

TheNewTricks.Courage = (function(Courage) {

  // Class private container.
  var PrivateCourage = Courage._private = Courage._private || {};

  var INITIAL_TIMEOUT_INTERVAL =    100,    // 100 ms.
      CEILING_TIMEOUT_INTERVAL = 300000;    // 5 min.

  // The ConnectionManager connects to a service over a WebSocket.
  //
  // It can send and receive binary messages.
  // If the connection is lost, the ConnectionManager uses an exponential backoff strategy
  // to reconnect to the service.
  //
  // The ConnectionManager is started with a WebSocket URL:
  //     var connectionManager = new ConnectionManager('ws://rt.thenewtricks.com:9090/');
  //
  // Messages can be sent with `send`:
  //     connectionManager.send(data);
  //
  // The following callbacks exist:
  //   - onOpen
  //   - onMessage
  //   - onError
  PrivateCourage.ConnectionManager = function ConnectionManager(url) {

    // Public members.
    this.onOpen    = function(){};
    this.onMessage = function(){};
    this.onError   = function(){};

    // Private members.
    this._private = {
      url: url,
      connection: null,
      timer: null,
      interval: INITIAL_TIMEOUT_INTERVAL,
    };

    // Connect to the service. Automatically retries when connection is lost.
    connect.bind(this)();
  };

  PrivateCourage.ConnectionManager.prototype = {

    // readyState returns the readyState of the underlying WebSocket. If there is
    // no underlying WebSocket, it returns CONNECTING.
    readyState: function readyState() {

      // Access to private members.
      var my = this._private;

      return my.connection.readyState;
    },

    // send sends binary data over the WebSocket connection.
    send: function send(data) {

      // Access to private members.
      var my = this._private;

      my.connection.send(data);
    },
  };

  // connect attempts to open a new WebSocket.
  //
  // The WebSocket is configured with the appropriate callbacks to enable reconnection
  // and calling the ConnectionManager's callback functions.
  function connect() {

    // Access to private members.
    var my = this._private;

    my.connection = new WebSocket(my.url);
    my.connection.binaryType = 'arraybuffer';
    my.connection.onopen = onWebSocketOpen.bind(this);
    my.connection.onclose = onWebSocketClose.bind(this);
    my.connection.onmessage = onWebSocketMessage.bind(this);
    my.connection.onerror = onWebSocketError.bind(this);
  }

  // onWebSocketOpen, mark the connection as connected and clear the retry timer.
  function onWebSocketOpen() {

    // Access to private members.
    var my = this._private;

    clearTimeout(my.timer);
    my.interval = INITIAL_TIMEOUT_INTERVAL;

    this.onOpen();
  }

  // onWebSocketclose, mark the connection as disconnected and start the retry timer
  // with an exponentially increasing interval with a ceiling.
  function onWebSocketClose(event) {

    // Access to private members.
    var my = this._private;

    my.timer = setTimeout(connect.bind(this), my.interval);

    // Calculate next timeout interval. Exponential backoff with ceiling.
    my.interval = my.interval * 2;
    my.interval = Math.min(my.interval, CEILING_TIMEOUT_INTERVAL);
  }

  // onWebSocketMessage, pass the message on to the callback.
  function onWebSocketMessage(event) {
    this.onMessage(event);
  }

  // onWebSocketError, pass the error on to the callback.
  function onWebSocketError(error) {
    this.onError(error);
  }

  return Courage;

})(TheNewTricks.Courage || {});