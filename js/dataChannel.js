/**
 * Created by chenwydj on 7/24/16.
 */


/*
 dataChannel.js
 */

//JavaScript variables associated with send and receive channels
var sendChannel, receiveChannel;
//JavaScript variables associated with demo buttons
var startDataChannelButton = document.getElementById("startChannelButton");
var sendButton = document.getElementById("sendButton");
var closeButton = document.getElementById("closeButton");
// textareas
var dataChannelSend = document.getElementById("dataChannelSend");
var dataChannelReceive = document.getElementById("dataChannelReceive");
//On startup, just the Start button must be enabled
startDataChannelButton.disabled = false;
sendButton.disabled = true;
closeButton.disabled = true;
//Associate handlers with buttons
startDataChannelButton.onclick = createConnection;
sendButton.onclick = sendData;
closeButton.onclick = closeDataChannels;

function createConnection() {
    RTCPeerConnection = getRTCPeerConnection();
    // This is an optional configuration string associated with NAT traversal setup
    var servers = null;
    // JavaScript variable associated with proper configuration of an RTCPeerConnection object
    // use DTLS/SRTP
    // {'RtpDataChannels': true} is required if we want to make use of the DataChannels API on Firefox.
    var pc_constraints = {
        'optional': [
            {'DtlsSrtpKeyAgreement': true}
        ]};

    // Create the local PeerConnection object with data channels
    localPeerConnection = new RTCPeerConnection(servers, pc_constraints);
    log("Created local peer connection object, with Data Channel");
    try {
        // Note: SCTP-based reliable DataChannels supported in Chrome 29+ !
        // use {reliable: false} if you have an older version of Chrome
        sendChannel = localPeerConnection.createDataChannel("sendDataChannel",{reliable: true});
        log('Created reliable send data channel');
    } catch (e) {
        alert('Failed to create data channel!');
        log('createDataChannel() failed with following message: ' + e.message);
    }
    // Associate handlers with peer connection ICE events
    localPeerConnection.onicecandidate = gotLocalIceCandidate;

    // Associate handlers with data channel events
    sendChannel.onopen = handleSendChannelStateChange;
    sendChannel.onclose = handleSendChannelStateChange;

    // Mimic a remote peer connection
    window.remotePeerConnection = new RTCPeerConnection(servers, pc_constraints);
    log('Created fake remote peer connection object, with DataChannel');

    // Associate handlers with peer connection ICE events...
    remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
    // ...and data channel creation event
    remotePeerConnection.ondatachannel = gotReceiveChannel;

    // We're all set! Let's start negotiating a session...
    localPeerConnection.createOffer(gotLocalDescription,onSignalingError);

    // Disable Start button and enable Close button
    startDataChannelButton.disabled = true;
    closeButton.disabled = false;
}

// Handler for sending data to the remote peer
function sendData() {
    var data = document.getElementById("dataChannelSend").value;
    sendChannel.send(data);
    log('Sent data: ' + data);
}

// Close button handler
function closeDataChannels() {
    // Close channels...
    log('Closing data channels');
    sendChannel.close();
    log('Closed send data channel with label: ' + sendChannel.label);
    receiveChannel.close();
    log('Closed receive data channel with label: ' + receiveChannel.label);
    // Close peer connections
    localPeerConnection.close();
    remotePeerConnection.close();
    // Reset local variables
    localPeerConnection = null;
    remotePeerConnection = null;
    log('Closed peer connections');
    startDataChannelButton.disabled = false;
    sendButton.disabled = true;
    closeButton.disabled = true;
    dataChannelSend.value = "";
    dataChannelReceive.value = "";
    dataChannelSend.disabled = true;
    dataChannelSend.placeholder = "1: Press Start; 2: Enter text; 3: Press Send.";
}



// Handler associated with the management of remote peer connection's data channel events
function gotReceiveChannel(event) {
    log('Receive Channel Callback: event --> ' + event);
    // Retrieve channel information
    // TODO ?? pass the sendChannel (created by localPeerConnection) to remote's receiveChannel
    receiveChannel = event.channel;
    // Set handlers for the following events: (i) open remote's receiveChannel; (ii) message processing; (iii) close
    receiveChannel.onopen = handleReceiveChannelStateChange;
    receiveChannel.onmessage = handleMessage;
    receiveChannel.onclose = handleReceiveChannelStateChange;
}

// Message event handler
function handleMessage(event) {
    log('Received message: ' + event.data);
    // Show message in the HTML5 page
    document.getElementById("dataChannelReceive").value = event.data;
    // Clean 'Send' text area in the HTML page
    document.getElementById("dataChannelSend").value = '';
}

// Handler for either 'open' or 'close' events on sender's data channel
function handleSendChannelStateChange() {
    var readyState = sendChannel.readyState;
    log('Send channel state is: ' + readyState);
    if (readyState == "open") {
        // Enable 'Send' text area and set focus on it
        dataChannelSend.disabled = false;
        dataChannelSend.focus();
        dataChannelSend.placeholder = "";
        // Enable both Send and Close buttons
        sendButton.disabled = false;
        closeButton.disabled = false;
    } else { // event MUST be 'close', if we are here...
        // Disable 'Send' text area
        dataChannelSend.disabled = true;
        // Disable both Send and Close buttons
        sendButton.disabled = true;
        closeButton.disabled = true;
    }
}

// Handler for either 'open' or 'close' events on receiver's data channel
function handleReceiveChannelStateChange() {
    var readyState = receiveChannel.readyState;
    log('Receive channel state is: ' + readyState);
}