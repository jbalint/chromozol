/**
 * Broadcast implementation that directly translates JSON events to RDF and sends a
 * SPARQL INSERT to the endpoint.
 */

SPARQL_INSERT_ENDPOINT = "https://localhost/stardog/bs/update";

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Expression_interpolation

function toSparqlTabActivated(msg) {
    return `[] a cmzl:TabActivatedEvent ; cmzl:tab cmzl:Tab-${msg.tabId} ; cmzl:time ${msg.time} .`;
}

function toSparqlTabClosed(msg) {
    return `[] a cmzl:TabClosedEvent ; cmzl:tab cmzl:Tab-${msg.tabId} ; cmzl:time ${msg.time} .`;
}

function toSparqlTabUpdated(msg) {
    var triples = buildTabUpdateEventMain(msg.time, msg.tabdata) + " . " + buildTabUpdateEventAux(msg.tabdata);
    return triples;
}

function toSparqlSessionStart(msg) {
    var triples = "";
    triples += `[] a cmzl:SessionStartEvent ; cmzl:time ${msg.time} ; cmzl:session cmzl:Session-${sessionId} ; \n`;
    //var tabinfo = msg.tabinfo.slice(0, 4);
    var tabinfo = msg.tabinfo;
    tabinfo.map(function (tab) {
        triples += "cmzl:hasSubEvent " + buildTabUpdateEventMain(msg.time, tab) + " ; \n";
    });
    triples += " . ";
    tabinfo.map(function (tab) {
        triples += buildTabUpdateEventAux(tab) + "\n";
    });
    triples += `cmzl:Session-${sessionId} a cmzl:Session ; cmzl:hostname "jrussell" ; cmzl:sessionId "${msg.sessionId}" . \n`;
    return triples;
}

function buildTabUpdateEventMain(time, tab) {
    // TODO : is this good enough for SPARQL??? seems dubious
    var title = tab.title.replace(/"/g, '\\"');
    var url = encodeURI(tab.url);
    var triples = `[ a cmzl:TabUpdatedEvent ; cmzl:tab cmzl:Tab-${tab.id} ; cmzl:time ${time} ; cmzl:content [ a cmzl:TabContent ; cmzl:title "${title}" ; cmzl:url <${url}>`;
    if (tab.favIconUrl && isInspectableUrl(tab.favIconUrl)) {
        var favIconUrl = encodeURI(tab.favIconUrl);
        triples += ` ; cmzl:favIconUrl <${favIconUrl}>`;
    }
    triples += ` ] ] `;
    return triples;
}

function buildTabUpdateEventAux(tab) {
    var triples = `cmzl:Session-${sessionId} cmzl:hasTab cmzl:Tab-${tab.id} . `;
    triples += `cmzl:Tab-${tab.id} a cmzl:Tab ; cmzl:tabId "${tab.id}" `;
    if (tab.openerTabId) {
        triples += `; cmzl:openedBy cmzl:Tab-${tab.openerTabId} `;
    }
    triples += ". ";
    return triples;
}

var toSparqlTranslationFunctions = new Object();
toSparqlTranslationFunctions["session-start"] = toSparqlSessionStart;
toSparqlTranslationFunctions["tab-activated"] = toSparqlTabActivated;
toSparqlTranslationFunctions["tab-updated"] = toSparqlTabUpdated;
toSparqlTranslationFunctions["tab-closed"] = toSparqlTabClosed;

/**
 * Broadcast a message using a SPARQL INSERT
 */
function broadcastEventToSparqlInsert(msg) {
    var eventTranslator = toSparqlTranslationFunctions[msg.event];
    if (!eventTranslator) {
        throw Error("Unrecognized event type: " + msg.event);
    }
    var triples = eventTranslator(msg);
    var query = `insert data { graph cmzl: { ${triples} } }`;
    var xhr = new XMLHttpRequest();
    //alert(escape(query));
    xhr.open("POST", SPARQL_INSERT_ENDPOINT, "true");
    xhr.setRequestHeader("Authorization", "Basic " + btoa("admin:admin"));
    xhr.setRequestHeader("Accept", "application/sparql-update");
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    if (true) {
        // NEED to use encodeURIComponent() and not just encodeURI() because it will have IRIs in it
        xhr.send("query=" + encodeURIComponent(query));
    } else {
        // this doesn't work...
        var formData = new FormData();
        formData.append("query", query);
        xhr.send(formData);
    }
    xhr.onreadystatechange = process;
    function process(e) {
        if (xhr.readyState === 4) {
            if (xhr.status !== 200) {
                console.log(e);
                console.log(xhr.responseText);
                throw Error("During insert: " + query);
            }
        }
    }
    if (TRACE_MESSAGES) {
        log("SPARQL insert event: ");
        log(query);
    }
}

// https://stackoverflow.com/questions/12770238/chrome-extension-onload-behaviour
document.addEventListener('DOMContentLoaded', function () { newSession(); }, false);

