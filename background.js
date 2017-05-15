// session ID of this browser or plugin "execution". Used to generate
// unique IDs across time. Should the plugin be restarted during
// development the "openerTabId" reference may not be valid.
sessionId = Date.now();

// name of Kafka which to broadcast events
EVENT_TOPIC = "chromozol-event";

// name of Kafka topic which to listen for control messages
CONTROL_TOPIC = "chromozol-control";

// Should messages be traced to the console?
TRACE_MESSAGES = false;

connectFailures = 0;

startupMessageSent = false;

function log(x) {
    if (typeof(x) === "string") {
        console.log(timeStamp() + ": " + x);
    }
    else {
        console.log(timeStamp() + ": ");
        console.log(x);
    }
}

// stolen from https://gist.github.com/hurjas/2660489
function timeStamp() {
    var now = new Date();
    var date = [  now.getFullYear(), now.getDate(), now.getMonth() + 1 ];
    var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];
    var suffix = ( time[0] < 12 ) ? "AM" : "PM";
    time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;
    time[0] = time[0] || 12;
    for ( var i = 1; i < 3; i++ ) {
        if ( time[i] < 10 ) {
            time[i] = "0" + time[i];
        }
    }
    return date.join("/") + " " + time.join(":") + " " + suffix;
}

function isInspectableUrl(url) {
	return url.indexOf("http") == 0 ||
		url.indexOf("file") == 0;
}

/**
 * Transform a Chrome `tab' object into a `tabInfo' used in events.
 */
function tabToTabData(t) {
    var tabData =  {url: t.url,
                    title: t.title,
                    favIconUrl: t.favIconUrl,
                    id: getGlobalTabId(t.id) };
    if (t.openerTabId) {
        tabData.openerTabId = getGlobalTabId(t.openerTabId);
    }
    return tabData;
}

WS = createWebSocket()

function createWebSocket() {
    var ws = new WebSocket("ws://localhost:7080/v2/broker/?topics=" + CONTROL_TOPIC);

    ws.onopen = function () {
        log("Web socket opened");
        connectFailures = 0;
        if (!startupMessageSent) {
            // TODO : send startup message, including ALL tab contents
            chrome.tabs.query({},
                              function (tabs) {
                                  var noMetaTabs = function (t) { return isInspectableUrl(t.url); };
                                  sendChromozolMessage({"event":"session-start",
                                                        "tabinfo":tabs.map(tabToTabData).filter(noMetaTabs)});
                              });
            startupMessageSent = true;
        }
    };
    ws.onerror = function (err) {
        log("Web socket error");
        log(err);
    }
    ws.onclose = function (err) {
        if (err.reason === "Idle timeout") {
            // reconnect
            WS = createWebSocket();
        }
        else {
            log("Web socket got closed");
            log(err);
        }
    };
    ws.onmessage = dispatchControlMessage

    return ws
}

var controlHandlers = {};
controlHandlers.tabActivate = function(msg) {
    // TODO : better reporting of bad session ID
    var session = msg.tabId.split(".")[0];
    var tabId = msg.tabId.split(".")[1];
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
        log(JSON.parse(evt.data));
    }
    // evt.data is the message from the websocket which still has the topic name attached
	log(evt.data.message);
	var msg = JSON.parse(JSON.parse(evt.data).message);
    var cmdName = msg.command;
    var handler = controlHandlers[cmdName];
    if (handler) {
        handler(msg);
    }
    else {
        log("ERROR: no dispatcher for command");
        log(msg);
    }
}

/**
 * Encode the tab ID to be globally unique.
 */
function getGlobalTabId(tabId) {
    return sessionId + "." + tabId;
}

/**
 * Broadcast a message to the Kafka queue
 */
function sendChromozolMessage(msg) {
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

/**
 * TAB UPDATE handler
 * 
 * We broadcast a new `tab-updated' message.
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status != "complete" || !isInspectableUrl(tab.url)) {
        return;
    }

    // for development/debugging. save the last tab if we need to inspect it against the event
    lastTab = tab;

    sendChromozolMessage({"event":"tab-updated", "tabdata":tabToTabData(tab)});
});

/**
 * TAB CLOSED handler
 *
 * We broadcast a new `tab-closed' message.
 */
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    sendChromozolMessage({"event":"tab-closed", "tabId":{id: getGlobalTabId(removeInfo.tabId)}});
});

/**
 * TAB ACTIVATED handler
 *
 * We broadcast a new `tab-activated' message.
 */
chrome.tabs.onActivated.addListener(function (activeInfo) {
    sendChromozolMessage({"event":"tab-activated", "tabId":{id: getGlobalTabId(activeInfo.tabId)}});
});
