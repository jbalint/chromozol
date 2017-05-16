/**
 * Callbacks for tab events to propagate to Kafka.
 */

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
    sendChromozolMessage({"event":"tab-closed", "tabId":getGlobalTabId(removeInfo.tabId)});
});

/**
 * TAB ACTIVATED handler
 *
 * We broadcast a new `tab-activated' message.
 */
chrome.tabs.onActivated.addListener(function (activeInfo) {
    sendChromozolMessage({"event":"tab-activated", "tabId":getGlobalTabId(activeInfo.tabId)});
});
