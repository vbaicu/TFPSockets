const isString = s => typeof (s) === 'string' || s instanceof String;

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
            if (isString(data.data)) {
                //handle incomming message
                try {
                    let obj = JSON.parse(data.data);
                    this.EventStream.emit(obj.eventName, obj)
                } catch (e) {
                    console.log("Message doesn't repect protocol with exception: ", e)
                }
            } else {
                //binary data wip
            }
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

}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TFPSocketsClient
} else {
}
