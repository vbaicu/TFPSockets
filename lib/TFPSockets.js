const WebSocket = require('ws')
const TextEncoder = require('text-encoding').TextEncoder
const TextDecoder = require('text-encoding').TextDecoder

const isString = s => typeof (s) === 'string' || s instanceof String;

const TFPUtils_packData = (data, eventName) => {
    if(eventName.length > 255) {
        throw "Event name length should be < 255"
        return
    }
    let enc = new TextEncoder("utf-8");
    eventName = enc.encode(eventName)
    let header = new Uint8Array([eventName.length, ...eventName])
    return new Uint8Array([...header,...data])
}

const TFPUtils_unpackData = unpacked => {
    let headerSize = new Uint8Array(unpacked.slice(0,1))[0]
    let header = new Uint8Array(unpacked.slice(1,headerSize+1))
    let data = new Uint8Array(unpacked.slice(headerSize+1))
    let eventName = new TextDecoder('utf-8').decode(header)
    return {eventName,payload:data}
}

class TFPBaseEventStream {
    constructor() {
        this.EventStream = (function () {

            var listeners = {};

            const paddListener = (name, callback) => {
                if (!listeners[name]) {
                    listeners[name] = [];
                }
                listeners[name] = [...listeners[name], callback];
            }

            const premoveListener = (name, callback) => listeners[name] = listeners[name].filter(c => c != callback);

            const pemit = (name, data) => (listeners[name] ? listeners[name] : []).forEach(c => c(data));


            return {
                addListener: (name, callback) => paddListener(name, callback),
                removeListener: (name, callback) => premoveListener(name, callback),
                emit: (name, data) => pemit(name, data)
            };
        }());
    }

    on(eventName, handler) {
        if(typeof handler === 'function'){
            this.EventStream.addListener(eventName, handler)
        } else {
            console.log("Handler needs to be a function")
        }
    }
}


class TFPSocketsClient extends TFPBaseEventStream {

    constructor(url, protocols, connection = null) {
        super()
        this.ws = connection != null ? connection : new WebSocket(url,protocols)
        this.isOpen = connection != null
        this.ws.on('open', event => {
            this.isOpen = true
            this.EventStream.emit('open',event)
        })
        this.ws.on('message', (data) => {
            var processedEvent;
            if (isString(data)) {
                try {
                    processedEvent = JSON.parse(data);
                } catch (e) {
                    console.log("Message doesn't repect protocol with exception: ", e)
                }
            } else {
                processedEvent = TFPUtils_unpackData(data)
            }
            this.EventStream.emit(processedEvent.eventName, processedEvent)
            this.EventStream.emit('message',processedEvent)
        })
        this.ws.on('close', () => this.EventStream.emit('close') )
    }

    send(eventName, payload) {
        let obj = { eventName, payload }
        if (this.isOpen) {
            this.ws.send(JSON.stringify(obj))
        } else {
            console.log("Connection is not opened")
        }
    }

    sendData(event,payload) {
        if (this.isOpen) {
            this.ws.send(TFPUtils_packData(payload,event))
        } else {
            console.log("Connection is not opened")
        }
    }

}

class TFPSocketsServer extends TFPBaseEventStream {
    constructor(server, protocols, customwss = null) {
        super()
        this.wss = customwss != null ? customwss : new WebSocket.Server({ server, handleProtocols: (ps, req) => { return protocols } });
        this.wss.on('connection', (ws, req) => {
            var client = new TFPSocketsClient(null, null,ws);
            this.EventStream.emit('connection', client);
        });
    }

}

module.exports = {
    client: TFPSocketsClient,
    server: TFPSocketsServer
}