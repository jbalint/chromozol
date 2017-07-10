/**
 * Utilities and global setup.
 */

// Should messages be traced to the console?
TRACE_MESSAGES = false;

// session ID of this browser or plugin "execution". Used to generate
// unique IDs across time. Should the plugin be restarted during
// development the "openerTabId" reference may not be valid.
sessionId = Date.now();

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
 * Encode the tab ID to be globally unique.
 */
function getGlobalTabId(tabId) {
    return sessionId + "." + tabId;
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
