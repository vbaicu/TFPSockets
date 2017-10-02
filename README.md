# TFPSockets
Simple, lightweight, event based websockets library for web and nodejs.

[**TFPSockets**](https://github.com/vbaicu/TFPSockets)

## Usage


### Install

```bash
npm install --save tfpSockets
```

### Client

**Include code - Browser**

```html 
<script src="TFPSocketsClient-Browser.js"> </script>
```

**Include code - Nodejs**

```javascript
const TFPSocketsClient = require('TFPSockets').client
```

**Open connection**

```javascript 
var conn = new TFPSocketsClient("ws://localhost:1600", ["chat"])
    conn.on('connected', event => {
        console.log('connected')
       
    })
```

**Add event listeners**
```javascript
conn.on('eventName', data => {
    console.log('Received event: ', data.eventName, 'with payload: ', data.payload)
})
```

**Listener for all events**

```javascript

All events will be sent to `message` listener even if there is another listener sent for those events.

conn.on('message', event => {
    console.log("onMessage received event: ",event)
  })
```

**Send Events**


```javascript
conn.send('eventName',{x:0,y:0})
```

**Send Data**

```javascript
conn.sendData('eventName',new Uint8Array())
```

Client for browser is build on top of WebSocket javascript object. TFPSocketsClient provides access to base socket object via `ws` property and can also be initialised with a pre initialised WebSocket instance using: 
```javascript
var client = new TFPSocketsClient(null, null,initialisedWS)
```

## Server
Server library is build on top of [**WS**](https://github.com/websockets/ws) libary. library provides access to base WebSocket.Server object via `wss` proprerty for those who need more customisation.

**Include**

```javascript
const TFPSocketsServer = require('TFPSockets').server
```

**Create Server (using express)**

```javascript
const express = require('express');
const http = require('http');
const url = require('url');

const app = express();


const server = http.createServer(app);

const TFPServer = new TFPSocketsServer(server,["chat"])

server.listen(1507, function listening() {
  console.log('Listening on %d', server.address().port);
});
```

**Listening for connections and event**
```javascript
TFPServer.on('connection',client => {
  client.on('testEvent', data => {
    console.log("test event payload: ", data.payload)
    client.send('testEventBack',{x:1,y:100})
  })
})
```

## Limitations & next steps
* ~~doesn't support binary data events - WIP~~
* ssl certificates setup - WIP

