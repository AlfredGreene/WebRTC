/**
 * Created by chenwydj on 7/23/16.
 */
// Look after different browser vendors' ways of calling the getUserMedia()
// API method:
// Opera --> getUserMedia
// Chrome --> webkitGetUserMedia
// Firefox --> mozGetUserMedia


// Media constraints only work on Chrome
var mediaConstraints = {
    // Use constraints to ask for a video-only MediaStream:
    // TODO a button for switch audio/video
    defaultConstraints : {audio: false, video: true},
    // Constraints object for low resolution video
    qvgaConstraints : { video: {
        mandatory: {
            maxWidth: 320,
            maxHeight: 240
        } }
    },
    // Constraints object for standard resolution video
    vgaConstraints : { video: {
        mandatory: {
            maxWidth: 640,
            maxHeight: 480
        } }
    },
    // Constraints object for high resolution video
    // TODO HD not working on macbook
    hdConstraints : { video: {
        mandatory: {
            minWidth: 1280,
            minHeight: 960
        } }
    }
};

// Immediately invoked function for video's quality-control buttons
var qualityControl = (function(){
    // TODO pass constrains from outside, like droplist choice
    // Define local variables associated with video resolution selection buttons in the HTML page
    var qvgaButton = document.querySelector("button#qvga");
    var vgaButton = document.querySelector("button#vga");
    // TODO HD not working on macbook
    var hdButton = document.querySelector("button#hd");
    // Associate actions with buttons:
    qvgaButton.onclick = function(){getMedia(mediaConstraints.qvgaConstraints)};
    vgaButton.onclick = function(){getMedia(mediaConstraints.vgaConstraints)};
    hdButton.onclick = function(){getMedia(mediaConstraints.hdConstraints)};
})();

// Used in navigator.getUserMedia
// Callback to be called if success in getting media from camera
// Bind local media stream to video element in main.html and play immediately
function gotLocalStream(stream) {
    // Note: make the returned stream available to console for inspection
    window.stream = stream;
    if (window.URL) {
        // Chrome case: URL.createObjectURL() converts a MediaStream to a blob URL
        // Associate the local video element with the retrieved stream
        localVideo.src = URL.createObjectURL(stream);
    } else {
        // Firefox and Opera: the src of the video can be set directly from the stream
        // Associate the local video element with the retrieved stream
        localVideo.src = stream;
    }
    // attach captured stream to localStream for later use in RTCPeerConnnection
    localStream = stream;
    log("Received local stream");
}

// Callback to be called in case of failures in getting camera media
function gotLocalStreamErrorCallback(error) {
    log("navigator.getUserMedia error: " + error);
}

// Main action: just call getUserMedia() on the navigator object
// Simple wrapper for getUserMedia() with constraints object as an input parameter
//function getMedia(constraints) {
//    // "!!" converts a value to a boolean and ensures a boolean type
//    if(!!localStream) {
//        video.src = null;
//        localStream.stop;
//    }
//    navigator.getUserMedia(constraints, successCallback, errorCallback);
//}

// Used in remotePeerConnection.createAnswer and localPeerConnection.createOffer
function onSignalingError(error) {
    log("Failed to create signaling message : " + error.name);
}
// TODO don't understand about description
// Handler to be called when the 'local' SDP becomes available
// Set *local* SDP as the right (local/remote) description for both local and remote parties
function gotLocalDescription(description) {
    // Add the local description to the local PeerConnection
    localPeerConnection.setLocalDescription(description);
    log("Offer from localPeerConnection: \n" + description.sdp);

    // ...do the same with the 'pseudoremote' PeerConnection
    // Note: this is the part that will have to be changed if you want the communicating peers to become remote
    // (which calls for the setup of a proper signaling channel)
    remotePeerConnection.setRemoteDescription(description);
    // Create the Answer to the received Offer based on the 'local' description
    remotePeerConnection.createAnswer(gotRemoteDescription, onSignalingError);
}
// TODO don't understand about description
// Handler to be called when the 'local' SDP becomes available
// Set *remote* SDP as the right (remote/local) description for both local and remote parties
function gotRemoteDescription(description) {
    // Set the remote description as the local description of the remote PeerConnection.
    remotePeerConnection.setLocalDescription(description);
    log("Answer from remotePeerConnection: \n" + description.sdp);
    // Conversely, set the remote description as the remote description of the local PeerConnection
    localPeerConnection.setRemoteDescription(description);
}

// TODO here the event is start button being clicked??
// Handler to be called as soon as the remote stream becomes available
// Attach remote stream to HTML element remoteVideo
function gotRemoteStream(event) {
    // Associate the remote video element with the retrieved stream
    if(window.URL) {
        // Chrome
        remoteVideo.src = window.URL.createObjectURL(event.stream);
    } else {
        // Firefox
        remoteVideo.src = event.stream;
    }
    log("Received remote stream");
}

// TODO don't quite understand ICE candidate
// Handler to be called whenever a new local ICE candidate becomes available
function gotLocalIceCandidate(event) {
    if(event.candidate) {
        // Add candidate to the remote PeerConnection
        remotePeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
        log("Local ICE candidate: \n" + event.candidate.candidate);
    }
}

// TODO don't quite understand ICE candidate
// Handler to be called whenever a new remote ICE candidate becomes available
function gotRemoteIceCandidate(event) {
    if (event.candidate) {
        // Add candidate to the local PeerConnection
        localPeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
        log("Remote ICE candidate: \n " + event.candidate.candidate);
    }
}


// JavaScript variables holding stream and connection information
var localStream, localPeerConnection, remotePeerConnection;
// JavaScript variables associated with HTML5 video elements in the page
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");

// JavaScript variables assciated with call management buttons in the page
var startButton = document.getElementById("startMediaButton");
var callButton = document.getElementById("callButton");
var hangupButton = document.getElementById("hangupButton");
// Just allow the user to click on the Call button at start-up
startButton.disabled = false;
callButton.disabled = true;
hangupButton.disabled = true;
// Associate JavaScript handlers with click events on the buttons
startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

// Function associated with clicking on the Start button
// This is the event triggering all other actions
// Start the call button and getting media from local camera
function start() {
    log("Requesting local stream");
    // First of all, disable the Start button on the page
    startButton.disabled = true;
    // Get ready to deal with different browser vendors...
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    // TODO pass constrains from outside, like droplist choice
    navigator.getUserMedia(mediaConstraints.defaultConstraints, gotLocalStream, gotLocalStreamErrorCallback);
    // We can now enable the Call button
    callButton.disabled = false;
}

// Function associated with clicking on the Call button
// This is enabled upon successful completion of the Start button handler
function call() {
    // First of all, disable the Call button on the page...
    callButton.disabled = true;
    // ...and enable the Hangup button
    hangupButton.disabled = false;
    log("Starting call");

    // Note that getVideoTracks() and getAudioTracks() are NOT currently supported in Firefox...
    // ...just use them with Chrome
    if (navigator.webkitGetUserMedia) {
        // Log info about video and audio device in use
        if (localStream.getVideoTracks().length > 0) {
            log('Using video device: ' + localStream.getVideoTracks()[0].label);
        }
        if (localStream.getAudioTracks().length > 0) {
            log('Using video device: ' + localStream.getAudioTracks()[0].label);
        }
    }

    var RTCPeerConnection = getRTCPeerConnection();

    // This is an optional configuration string, associated with NAT traversal setup
    var servers = null;

    // Create the local PeerConnection object with server configuration
    localPeerConnection = new RTCPeerConnection(servers);
    log("Created local peer connection object localPeerConnection");
    // Add a handler associated with ICE protocol events
    // TODO seems onicecandidate is running asyncronized
    localPeerConnection.onicecandidate = gotLocalIceCandidate;

    // Create the remote PeerConnection object
    remotePeerConnection = new RTCPeerConnection(servers);
    log("Created remote peer connection object remotePeerConnection");
    // Add a handler associated with ICE protocol events
    // TODO seems onicecandidate is running asyncronized
    remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
    // ...and a second handler to be activated as soon as the remote stream becomes available.
    // attach event.stream to remoteVideo HTML element
    remotePeerConnection.onaddstream = gotRemoteStream;

    // Add the local stream (as returned by gotLocalStream(stream)) to the local PeerConnection.
    localPeerConnection.addStream(localStream);
    log("Added localStream to localPeerConnection");

    // TODO don't understand about offer
    // We're all set! Create an Offer to be 'sent' to the callee as soon as the local SDP is ready.
    // will call gotLocalDescription, then will call gotRemoteDescription
    localPeerConnection.createOffer(gotLocalDescription, onSignalingError);
}

// Handler to be called when hanging up the call
function hangup() {
    log("Ending call");
    // Close PeerConnection(s)
    localPeerConnection.close();
    remotePeerConnection.close();
    // Reset local variables
    localPeerConnection = null;
    remotePeerConnection = null;
    // Disable Hangup button
    hangupButton.disabled = true;
    // Enable Call button to allow for new calls to be established
    callButton.disabled = false;
}