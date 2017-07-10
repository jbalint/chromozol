/**
 * Kafka library. Includes configuration and methods to send/receive messages.
 */

// name of Kafka which to broadcast events
EVENT_TOPIC = "chromozol-event";

// name of Kafka topic which to listen for control messages
CONTROL_TOPIC = "chromozol-control";

connectFailures = 0;

// TODO : this implementation is disabled. make switchable and don't init() unless enabled
//WS = createWebSocket();

nFailedRequests = 0;

function createWebSocket() {
    var ws = new WebSocket("ws://localhost:7080/v2/broker/?topics=" + CONTROL_TOPIC);

    ws.onopen = function () {
        //log("Web socket opened");
        connectFailures = 0;
        newSession();
    };
    ws.onerror = function (err) {
        log("Web socket error");
        log(err);
        WS = null;
    }
    ws.onclose = function (err) {
        if (err.reason === "Idle Timeout") {
            // reconnect
            WS = createWebSocket();
        }
        else {
            log("Web socket got closed");
            log(err);
            WS = null;
        }
    };
    ws.onmessage = dispatchControlMessage

    return ws
}

/**
 * Broadcast a message to the Kafka queue
 */
function broadcastEventToKafka(msg) {
    if (!WS) {
        if (nFailedRequests++ > 20) {
            // try to reconnect after 20 failed requests
            WS = createWebSocket();
        }
        if (!WS) {
            log("WebSocket not available");
            return;
        }
    }
    var broadcast = {}
    broadcast.topic = EVENT_TOPIC;
    // we have to stringify() this for kafka-websocket's TextDecoder
    broadcast.message = JSON.stringify(msg);
    WS.send(JSON.stringify(broadcast));
    if (TRACE_MESSAGES) {
        log("Kafka broadcast event: ");
        log(broadcast);
    }
}
