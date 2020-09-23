/**
 * Callbacks for tab events.
 *
 * https://developer.chrome.com/extensions/tabs
 */

broadcastFunction = broadcastEventToSparqlInsert

startupMessageSent = false;

function broadcast(msg) {
    msg.time = Date.now()
    broadcastFunction(msg)
}

function newSession(callback) {
        if (!startupMessageSent) {
            // TODO : send startup message, including ALL tab contents
            chrome.tabs.query({},
                              function (tabs) {
                                  var noMetaTabs = function (t) { return isInspectableUrl(t.url); };
                                  log("Initializing session " + sessionId);
                                  broadcast({"event":"session-start",
                                             "sessionId":sessionId,
                                             "tabinfo":tabs.map(tabToTabData).filter(noMetaTabs)});
                              });
            startupMessageSent = true;
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

    broadcast({"event":"tab-updated", "tabdata":tabToTabData(tab)});
});

/**
 * TAB CLOSED handler
 *
 * We broadcast a new `tab-closed' message.
 */
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    broadcast({"event":"tab-closed", "tabId":getGlobalTabId(tabId)});
});

/**
 * TAB ACTIVATED handler
 *
 * We broadcast a new `tab-activated' message.
 */
chrome.tabs.onActivated.addListener(function (activeInfo) {
    broadcast({"event":"tab-activated", "tabId":getGlobalTabId(activeInfo.tabId)});
});
