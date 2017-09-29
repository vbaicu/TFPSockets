const express = require('express');
const http = require('http');
const url = require('url');
const TFPSockets = require('./index')


const app = express();


const server = http.createServer(app);

const TFPServer = new TFPSockets.server(server,["chat"])
TFPServer.on('connection',client => {
  client.on('testEvent', data => {
    console.log("test event payload: ", data.payload)
    client.send('testEventBack',{x:1,y:100})
  })
})


const testClient = new TFPSockets.client("ws://localhost:1507",["chat"])
testClient.on('open', event => {
  console.log("test client open")
  testClient.send('testEvent',{x:10,y:89})
})

testClient.on('testEventBack', data => {
  console.log('testEventBack ', data.payload);
})



server.listen(1507, function listening() {
  console.log('Listening on %d', server.address().port);
});