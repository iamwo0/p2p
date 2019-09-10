/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

/**
 * Crate answer on client B
 */

import PeerConnectionAdapter from './lib/PeerconnectionAdapter';

var getMediaButton = document.querySelector('button#getMedia');
var createPeerConnectionButton = document.querySelector('button#createPeerConnection');
var createOfferButton = document.querySelector('button#createOffer');
var setOfferButton = document.querySelector('button#setOffer');
var createAnswerButton = document.querySelector('button#createAnswer');
var setAnswerButton = document.querySelector('button#setAnswer');
var hangupButton = document.querySelector('button#hangup');
var dataChannelDataReceived;

getMediaButton.onclick = getMedia;
createPeerConnectionButton.onclick = loginAndConnect;
createOfferButton.onclick = createOffer;
setOfferButton.onclick = setOffer;
createAnswerButton.onclick = createAnswer;
setAnswerButton.onclick = setAnswer;
hangupButton.onclick = hangup;

var offerSdpTextarea = document.querySelector('div#local textarea');
var answerSdpTextarea = document.querySelector('div#remote textarea');

var audioSelect = document.querySelector('select#audioSrc');
var videoSelect = document.querySelector('select#videoSrc');

audioSelect.onchange = videoSelect.onchange = getMedia;

var localVideo = document.querySelector('div#local #localVideo1');
var localVideo2 = document.querySelector('div#local #localVideo2');
var remoteVideo1= document.querySelector('div#remote #remoteVideo1');
var remoteVideo2 = document.querySelector('div#remote #remoteVideo2');

var selectSourceDiv = document.querySelector('div#selectSource');

var localEndpointInput = document.querySelector('#local_endpoint');
var remoteEndpointInput = document.querySelector('#remote_endpoint');

var localPeerConnection;
var remotePeerConnection;
var localStream;
var localStream2;
var sendChannel;
var receiveChannel;
var dataChannelOptions = {
  ordered: true
};
var dataChannelCounter = 0;
var sendDataLoop;
var offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

var answerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

// var selectedDevice = '08005f695ee18b8845f37e991bfeb05a980f79102d7895da4c984b05e03633bc';
var selectedDevice = '04d27eb16e87e5cc918ccbfa292f96c161320514c4dcff14d096521a28f942e2';


getSources();

function getSources() {
  if (typeof MediaStreamTrack === 'undefined') {
    alert(
      'This browser does not support MediaStreamTrack.\n\nTry Chrome Canary.');
  } else {
    navigator.mediaDevices.enumerateDevices().then(gotSources);
  }
}

function gotSources(sourceInfos) {
  selectSourceDiv.classList.remove('hidden');
  var audioCount = 0;
  var videoCount = 0;
  for (var i = 0; i < sourceInfos.length; i++) {
    var option = document.createElement('option');
    option.value = sourceInfos[i].deviceId;
    option.text = sourceInfos[i].label;
    if (sourceInfos[i].kind === 'audioinput') {
      audioCount++;
      if (option.text === '') {
        option.text = 'Audio ' + audioCount;
      }
      audioSelect.appendChild(option);
    } else if (sourceInfos[i].kind === 'videoinput') {
      videoCount++;
      if (option.text === '') {
        option.text = 'Video ' + videoCount;
      }
      videoSelect.appendChild(option);
    } else {
      // console.log('unknown', JSON.stringify(sourceInfos[i]));
    }
  }
  getMediaButton.click();
}

function getMedia2(aa, widthss, heightss, callback) {
  getMediaButton.disabled = true;
  createPeerConnectionButton.disabled = false;

  if (localStream2) {
    localVideo2.src = null;
    localStream2.getTracks().forEach(function (track) {
      track.stop();
    });
  }
  var audioSource = audioSelect.value = selectedDevice;
  trace('Selected audio source: ' + audioSource);
  var videoSource = videoSelect.value = selectedDevice;
  trace('Selected video source: ' + videoSource);
  if (widthss == null) {
    widthss = 320;
  }
  if (heightss == null) {
    heightss = 180;
  }
  var constraints = {
    audio: {
      optional: [{
        sourceId: audioSource
      }],
    },
    video: {width: {exact: widthss}, height: {exact: heightss}, deviceId: videoSource}
  };
  trace('Requested local stream');
  if (!callback) {
    callback = gotStream2;
  }
  navigator.mediaDevices.getUserMedia(constraints)
    .then(callback)
    .catch(function (e) {
      console.log('navigator.getUserMedia error: ', e);
    });
}

function getMedia(aa, widthss, heightss, callback) {
  getMediaButton.disabled = true;
  createPeerConnectionButton.disabled = false;

  if (localStream) {
    localVideo.src = null;
    localStream.getTracks().forEach(function (track) {
      track.stop();
    });
  }
  var audioSource = audioSelect.value = selectedDevice;
  trace('Selected audio source: ' + audioSource);
  var videoSource = videoSelect.value = selectedDevice;
  trace('Selected video source: ' + videoSource);
  if (widthss == null) {
    widthss = 1280;
  }
  if (heightss == null) {
    heightss = 720;
  }
  var constraints = {
    audio: {
      optional: [{
        sourceId: audioSource
      }],
    },
    video: {width: {exact: widthss}, height: {exact: heightss}, deviceId: videoSource}
  };
  trace('Requested local stream');
  if (!callback) {
    callback = gotStream;
  }
  navigator.mediaDevices.getUserMedia(constraints)
    .then(callback)
    .catch(function (e) {
      console.log('navigator.getUserMedia error: ', e);
    });
}

function gotStream2(stream) {
  trace('Received local stream');
  localVideo2.srcObject = stream;
  localStream2 = stream;
  createPeerConnectionButton.click();
}

function gotStream(stream) {
  trace('Received local stream');
  localVideo.srcObject = stream;
  localStream = stream;
  // createPeerConnectionButton.click();
  getMedia2();
}

var localVideoSender;

var name, connectedUser, connection;

function loginAndConnect() {
  connection = new WebSocket("ws://127.0.0.1:8080");
  connection.onopen = function () {
    name = localEndpointInput.value;
    var loginObject = {
      type: 'login',
      name: name
    }
    console.log("Connected and will login as ", loginObject);
    doSend(loginObject, false);
  };

  connection.onmessage = function (message) {
    console.log("Got message", JSON.parse(message.data));
    var data = JSON.parse(message.data);
    switch (data.type) {
      case "login":
        onLogin(data.success);
        break;
      case 'join':
        onJoinRoom(data);
        break;
      case "offer":
        onOffer(data.offer, data.name);
        break;
      case "answer":
        onAnswer(data.answer);
        break;
      case "candidate":
        onCandidate(data.candidate);
        break;
      case "leave":
        onLeave();
        break;
      default:
        break;
    }
  };

  connection.onerror = function (err) {
    console.error(err);
  }

}

function doSend(message, authorized) {
  if(authorized == true){
    connectedUser = remoteEndpointInput.value;
    if (connectedUser) {
      message.name = connectedUser;
    }
  }
  connection.send(JSON.stringify(message));
}

function onLogin(data) {
  console.log("Connected result ", data);
  if (data == true) {
    localEndpointInput.value = name;
    createPeerConnection();
    joinRoom();
  }
}

function joinRoom() {
  let room = {
    type: 'join',
    name: localEndpointInput.value,
    room : '1010110'
  };
  doSend(room, false);
}

function onJoinRoom(data) {
  console.log('Get join result', data);
}

function onOffer(sdp, name) {
  console.log("on offer from ", name);
  var offer = {
    type: 'offer',
    sdp: sdp
  };
  localPeerConnection.setRemoteDescription(offer, onSetSessionDescriptionSuccess, onSetSessionDescriptionError);
  offerSdpTextarea.value = sdp;
  offerSdpTextarea.disabled = true;
  createOfferButton.disabled = true;
  setOfferButton.disabled = true;
}

function onAnswer(sdp) {
  console.log("on answer ", sdp);
  var answer = {
    type: 'answer',
    sdp: sdp
  };
  localPeerConnection.setRemoteDescription(answer, onSetSessionDescriptionSuccess, onSetSessionDescriptionError);
  answerSdpTextarea.value = sdp;
  answerSdpTextarea.disabled = true;
  createAnswerButton.disabled = true;
  setAnswerButton.disabled = true;
}

function onCandidate(candidate) {
  console.log("on candidate ", candidate);
  if (candidate) {
    localPeerConnection.addIceCandidate(candidate, onAddIceCandidateSuccess, onAddIceCandidateError);
  }
}

function onLeave() {

}


function createPeerConnection() {
  createPeerConnectionButton.disabled = true;
  createOfferButton.disabled = false;
  createAnswerButton.disabled = false;
  setOfferButton.disabled = false;
  setAnswerButton.disabled = false;
  hangupButton.disabled = false;
  trace('Starting call');

  if(localStream){
    var videoTracks = localStream.getVideoTracks();
    var audioTracks = localStream.getAudioTracks();
    if (videoTracks.length > 0) {
      trace('Using video device: ' + videoTracks[0].label);
    }
    if (audioTracks.length > 0) {
      trace('Using audio device: ' + audioTracks[0].label);
    }
  }
  if(localStream2){
    var videoTracks = localStream2.getVideoTracks();
    var audioTracks = localStream2.getAudioTracks();
    if (videoTracks.length > 0) {
      trace('Using video device: ' + videoTracks[0].label);
    }
    if (audioTracks.length > 0) {
      trace('Using audio device: ' + audioTracks[0].label);
    }
  }

  var servers = {
    sdpSemantics: "unified-plan",
    // sdpSemantics: "plan-b",
    iceServers: [{"urls": "stun:124.202.164.3"}]
  };

  localPeerConnection = new PeerConnectionAdapter(servers);
  trace('Created local peer connection object localPeerConnection', localPeerConnection);
  console.log('Created local peer connection object localPeerConnection', localPeerConnection);
  localPeerConnection.onicecandidate(candidateSdp=>{
    let candidate = {
      type: 'candidate',
      sdp: candidateSdp
    }
    console.log('send candidate from B', candidate);
    doSend(candidate, true);
  });
  if (RTCPeerConnection.prototype.createDataChannel) {
    sendChannel = localPeerConnection.peerconnection.createDataChannel('sendDataChannel',
      dataChannelOptions);
    sendChannel.onopen = onSendChannelStateChange;
    sendChannel.onclose = onSendChannelStateChange;
    sendChannel.onerror = onSendChannelStateChange;
  }


  localPeerConnection.peerconnection.ontrack = gotRemoteStream;
  localPeerConnection.peerconnection.ondatachannel = receiveChannelCallback;

  if (getMediaButton.disabled == true) {
    if(localStream){
      localStream.getTracks().forEach(
        function (track) {
          var sender = localPeerConnection.peerconnection.addTrack(
            track,
            localStream
          );
          if ('video' == sender.track.kind) {
            localVideoSender = sender;
          }
        }
      );
      trace('Adding Local Stream to peer connection');
    }
    if(localStream2){
      localStream2.getTracks().forEach(
        function (track) {
          var sender = localPeerConnection.peerconnection.addTrack(
            track,
            localStream2
          );
          if ('video' == sender.track.kind) {
            localVideoSender = sender;
          }
        }
      );
      trace('Adding Local Stream2 to peer connection');
    }
  }
}

function onSetSessionDescriptionSuccess() {
  trace('Set session description success.');
}

function onSetSessionDescriptionError(error) {
  trace('Failed to set session description: ' + error.toString());
}

function maybeAddLineBreakToEnd(sdp) {
  var endWithLineBreak = new RegExp(/\n$/);
  if (!endWithLineBreak.test(sdp)) {
    return sdp + '\n';
  }
  return sdp;
}

function createOffer() {
  localPeerConnection.createOffer(
    gotDescription1,
    onCreateSessionDescriptionError,
    offerOptions
  );
  createOfferButton.disabled = true;
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function setOffer() {
  var sdp = offerSdpTextarea.value;
  sdp = maybeAddLineBreakToEnd(sdp);
  sdp = sdp.replace(/\n/g, '\r\n');
  var offer = {
    type: 'offer',
    sdp: sdp
  };
  localPeerConnection.setLocalDescription(
    offer,
    onSetSessionDescriptionSuccess,
    onSetSessionDescriptionError
  );
  // trace('Modified Offer from localPeerConnection');
  doSend(offer, true);
  setOfferButton.disabled = true;
}

function gotDescription1(description) {
  offerSdpTextarea.disabled = false;
  offerSdpTextarea.value = description.sdp;
  trace('on create offer success, \n', description.sdp);
}

function createAnswer() {
  localPeerConnection.createAnswer(
    gotDescription2,
    onCreateSessionDescriptionError,
    answerOptions
  );
  createAnswerButton.disabled = true;
}

function setAnswer() {
  var sdp = answerSdpTextarea.value;
  sdp = maybeAddLineBreakToEnd(sdp);
  sdp = sdp.replace(/\n/g, '\r\n');
  var answer = {
    type: 'answer',
    sdp: sdp
  };
  localPeerConnection.setLocalDescription(
    answer,
    onSetSessionDescriptionSuccess,
    onSetSessionDescriptionError
  );
  // trace('Modified Answer from remotePeerConnection \n' + sdp);
  doSend(answer, true);
  setAnswerButton.disabled = true;
}

function gotDescription2(description) {
  answerSdpTextarea.disabled = false;
  answerSdpTextarea.value = description.sdp;
  trace('on create answer success: \n', description.sdp);
}

function sendData() {
  sendChannel.send(dataChannelCounter);
  trace('DataChannel send counter: ' + dataChannelCounter);
  dataChannelCounter++;
}

function hangup() {
  remoteVideo1.src = '';
  remoteVideo2.src = '';
  trace('Ending call');
  localStream.getTracks().forEach(function (track) {
    track.stop();
  });
  sendChannel.close();
  if (receiveChannel) {
    receiveChannel.close();
  }
  localPeerConnection.close();
  remotePeerConnection.close();
  localPeerConnection = null;
  remotePeerConnection = null;
  offerSdpTextarea.disabled = true;
  answerSdpTextarea.disabled = true;
  getMediaButton.disabled = false;
  createPeerConnectionButton.disabled = true;
  createOfferButton.disabled = true;
  setOfferButton.disabled = true;
  createAnswerButton.disabled = true;
  setAnswerButton.disabled = true;
  hangupButton.disabled = true;

  // @TODO send leave
}

function gotRemoteStream(e) {
  let stream = e.streams[0];
  if(stream.getVideoTracks().length){
    if(!remoteVideo1.srcObject){
      remoteVideo1.srcObject = e.streams[0];
    }else {
      remoteVideo2.srcObject = e.streams[0];
    }
  }
  trace('Received remote stream');
}

function onAddIceCandidateSuccess() {
  trace('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
  trace('Failed to add Ice Candidate: ' + error.toString());
}

function receiveChannelCallback(event) {
  trace('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveMessageCallback(event) {
  dataChannelDataReceived = event.data;
  trace('DataChannel receive counter: ' + dataChannelDataReceived);
}

function onSendChannelStateChange() {
  var readyState = sendChannel.readyState;
  trace('Send channel state is: ' + readyState);
  if (readyState === 'open') {
    sendDataLoop = setInterval(sendData, 10000);
  } else {
    clearInterval(sendDataLoop);
  }
}

function onReceiveChannelStateChange() {
  var readyState = receiveChannel.readyState;
  trace('Receive channel state is: ' + readyState);
}
