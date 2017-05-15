/**
 * Control library. Handles incoming control messages.
 */

// handlers by event
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
