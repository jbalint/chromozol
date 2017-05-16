/**
 * Kafka library. Includes configuration and methods to send/receive messages.
 */

// name of Kafka which to broadcast events
EVENT_TOPIC = "chromozol-event";

// name of Kafka topic which to listen for control messages
CONTROL_TOPIC = "chromozol-control";

// Should messages be traced to the console?
TRACE_MESSAGES = false;

connectFailures = 0;

startupMessageSent = false;

WS = createWebSocket()

function createWebSocket() {
    var ws = new WebSocket("ws://localhost:7080/v2/broker/?topics=" + CONTROL_TOPIC);

    ws.onopen = function () {
        //log("Web socket opened");
        connectFailures = 0;
        if (!startupMessageSent) {
            // TODO : send startup message, including ALL tab contents
            chrome.tabs.query({},
                              function (tabs) {
                                  var noMetaTabs = function (t) { return isInspectableUrl(t.url); };
                                  sendChromozolMessage({"event":"session-start",
                                                        "sessionId":sessionId,
                                                        "tabinfo":tabs.map(tabToTabData).filter(noMetaTabs)});
                              });
            startupMessageSent = true;
        }
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
function sendChromozolMessage(msg) {
    if (!WS) {
        log("WebSocket not available");
        return;
    }
    var broadcast = {}
    broadcast.topic = EVENT_TOPIC;
    // we have to stringify() this for kafka-websocket's TextDecoder
    msg.time = Date.now()
    broadcast.message = JSON.stringify(msg);
    WS.send(JSON.stringify(broadcast));
    if (TRACE_MESSAGES) {
        log("Broadcast event: ");
        log(broadcast);
    }
}
