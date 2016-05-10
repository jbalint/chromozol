// WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

// session ID of this browser or plugin "execution". Used to generate
// unique IDs across time. Should the plugin be restarted during
// development the "openerTabId" reference may not be valid.
sessionId = Date.now();

// Kafka topic name to broadcast to
TOPIC_NAME = "chromozol";

function log(x) {
    console.log(timeStamp() + ": " + x);
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

function wsOnMessage(evt) {
	var msg = evt.data;
    log("GOT a message: " + msg);
}

log("DOING THE WEB SOCKET");

// testing with `websocketd'
//ws = new WebSocket("ws://localhost:8080");

// https://github.com/b/kafka-websocket
ws = new WebSocket("ws://localhost:7080/v2/broker/?topics=chromozol");
ws.onmessage = wsOnMessage

ws.onopen = function () {
    ws.send('{ "topic" : "chromozol", "message" : "hi from chromium" }');
};
ws.onclose = function () {
    log("WebSocket got closed");
};

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == "complete" && isInspectableUrl(tab.url)) {
        // log("Tab UPD (" + tabId + ") --------------------------");
        // log("Tab UPD (" + tabId + ") TITLE: " + tab.title);
        // log("Tab UPD (" + tabId + ") URL: " + tab.url);
        // log("Tab UPD (" + tabId + ") FAVICO: " + tab.favIconUrl);

        var tabdata = {};
        tabdata.viewtime = Date.now()
        tabdata.id = sessionId + "." + tab.id;
        tabdata.title = tab.title;
        tabdata.url = tab.url;
        tabdata.favIconUrl = tab.favIconUrl;
        if (tab.openerTabId) {
            tabdata.openerTabId = sessionId + "." + tab.openerTabId;
        }
        //log(JSON.stringify(tabdata));

        // for development
        lastTab = tab;

        var broadcast = {}
        broadcast.topic = TOPIC_NAME;
        broadcast.message = JSON.stringify(tabdata);
        //broadcast.message = tabdata;
        ws.send(JSON.stringify(broadcast));
        log("Broadcast: " + JSON.stringify(broadcast));
    }
});
