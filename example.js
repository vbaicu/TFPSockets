const express = require('express');
const http = require('http');
const url = require('url');
const TFPSockets = require('./index')
const TextEncoder = require('text-encoding').TextEncoder
const TextDecoder = require('text-encoding').TextDecoder


const app = express();


const server = http.createServer(app);

const eventFilter = (event,f) => [event].filter(f);

const TFPServer = new TFPSockets.server(server,["chat"])
TFPServer.on('connection',client => {
  client.on('testEvent', data => {
    console.log("test event payload: ", data.payload)
    client.send('testEventBack',{x:1,y:100})
  })

  client.on('message',event => {
    console.log("onMessage received event: ",event)
  })

  client.on('dataEvent', event => {
    let text = new TextDecoder('utf-8').decode(event.payload)
    console.log("received data event with payload ", text)
  })

})


const testClient = new TFPSockets.client("ws://localhost:1507",["chat"])
testClient.on('open', event => {
  console.log("test client open")
  testClient.send('testEvent',{x:10,y:89})
  testClient.send('event2',{})

  let data = new TextEncoder('utf-8').encode("Hello world as Uint8Array")
  testClient.sendData('dataEvent',data); 

})

testClient.on('testEventBack', data => {
  console.log('testEventBack ', data.payload);
})



server.listen(1507, function listening() {
  console.log('Listening on %d', server.address().port);
});