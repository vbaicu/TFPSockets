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

class TFPSocketsClient {

    constructor(url, protocols,cutomws = null) {

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

        this.connectionUrl = url
        this.connectionProtocols = protocols
        this.isOpen = false
        this.handlers = {}
        this.ws = cutomws != null ? cutomws: new WebSocket(url, protocols)
        this.ws.onopen = event => {
            this.isOpen = true
            this.EventStream.emit('connected', event)
        }
        this.ws.onclose = event => {
            this.isOpen = false
            this.EventStream.emit('disconnected', event)
        }
        this.ws.binaryType = "arraybuffer"
        this.ws.onmessage = (data) => {
            var processedEvent;
            if (isString(data.data)) {
                try {
                    processedEvent = JSON.parse(data.data);
                } catch (e) {
                    console.log("Message doesn't repect protocol with exception: ", e)
                }
            } else {
                processedEvent = TFPUtils_unpackData(data.data)
            }
            this.EventStream.emit(processedEvent.eventName, processedEvent)
            this.EventStream.emit('message',processedEvent)
        }
    }

    on(eventName, handler) {
        this.EventStream.addListener(eventName, handler)
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TFPSocketsClient
} else {
}
