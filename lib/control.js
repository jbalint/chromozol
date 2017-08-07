/**
 * Websocket-based control library. Handles incoming control messages.
 */

function createWebSocket() {
    var ws = new WebSocket("ws://localhost:7080/");

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
    ws.onmessage = dispatchControlMessage;

    return ws
}

createWebSocket();

// handlers by event
var controlHandlers = {};
controlHandlers.tabActivate = function(args) {
    log("Args");
    log(args);
    var globalTabId = args[0]
    // TODO : better reporting of bad session ID
    var session = globalTabId.split(".")[0];
    var tabId = globalTabId.split(".")[1];
    chrome.tabs.update(parseInt(tabId), {"active":true});
}

/**
 * Dispatcher for control messages.
 *
 * @param evt the web socket `onmessage' event
 */
function dispatchControlMessage(evt) {
    if (TRACE_MESSAGES) {
        log("Incoming control: ");
        log(evt.data);
    }
	var msg = evt.data;
    var split = msg.split(" ");
    var cmdName = split[0];
    var handler = controlHandlers[cmdName];
    if (handler) {
        handler(split.slice(1));
    }
    else {
        log("ERROR: no dispatcher for command");
        log(msg);
    }
}
