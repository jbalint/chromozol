

function wsOnMessage(evt) {
	var msg = evt.data;
    console.log("GOT a message: " + msg);
}

console.log("DOING THE WEB SOCKET");

ws = new WebSocket("ws://localhost:8080");
ws.onmessage = wsOnMessage
