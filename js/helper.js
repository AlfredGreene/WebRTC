/**
 * Created by chenwydj on 7/24/16.
 */


// Utility function for logging information to the JavaScript console
function log(text) {
    console.log("At time: " + (performance.now() / 1000).toFixed(3) + " --> " + text);
}


// "Factorize" and return the correct RTCPeerConnection class based on browser
function getRTCPeerConnection() {
    // Chrome
    if (navigator.webkitGetUserMedia) {
        RTCPeerConnection = webkitRTCPeerConnection;
    }
    // Firefox
    else if (navigator.mozGetUserMedia) {
        RTCPeerConnection = mozRTCPeerConnection;
        // TODO may need to return RTCSessionDescription and RTCIceCandidate
        RTCSessionDescription = mozRTCSessionDescription;
        RTCIceCandidate = mozRTCIceCandidate;
    }
    log("RTCPeerConnection object: " + RTCPeerConnection);
    return RTCPeerConnection;
}