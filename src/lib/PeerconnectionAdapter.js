'use strict';

/**
 *
 * @param ice_config
 * @param constraints
 * @constructor
 */
function PeerConnectionAdapter(ice_config, constraints) {

  this.useUnified = (ice_config && ice_config.sdpSemantics == 'unified-plan') ? true : false;

  if(this.useUnified){
    if(ice_config){
      ice_config.sdpSemantics = 'unified-plan';
    }else {
      ice_config = {
        sdpSemantics: "unified-plan"
      };
    }
  }

  this.peerconnection = new RTCPeerConnection(ice_config, constraints);
  try{
    const Interop = require('../../../sdp-interop/lib').Interop;
    this.interop = new Interop();
  }catch (e) {
    console.error(e);
  }
}


/**
 *
 * @param description
 * @param successCallback
 * @param failureCallback
 */
PeerConnectionAdapter.prototype.setLocalDescription
  = function (description, successCallback, failureCallback) {
  var self = this;
  self.peerconnection.setLocalDescription(description).then(success=>{
    console.log('set local description success');
    if(successCallback && typeof successCallback == 'function')
      successCallback(success);
  }).catch(error=>{
    console.error('on set local description failed: ', error);
    if(failureCallback && typeof failureCallback == 'function')
      failureCallback(error);
  });
};

/**
 *
 * @param description
 * @param successCallback
 * @param failureCallback
 */
PeerConnectionAdapter.prototype.setRemoteDescription
  = function (description, successCallback, failureCallback) {
  var self = this;
  // if we're running on FF, transform to Unified Plan first.
  if (navigator.mozGetUserMedia || self.useUnified)
    description = self.interop.toUnifiedPlan(description);
  else
    description = self.interop.toPlanB(description);
  self.peerconnection.setRemoteDescription(description).then(success=>{
    console.log('on set remote description success');
    if(successCallback && typeof successCallback == 'function')
      successCallback(success);
  }).catch(error=>{
    console.error('on set remote description failed: ', error);
    if(failureCallback && typeof failureCallback == 'function')
      failureCallback(error);
  });
};

/**
 *
 * @param successCallback
 * @param failureCallback
 * @param constraints
 */
PeerConnectionAdapter.prototype.createAnswer
  = function (successCallback, failureCallback, constraints) {
  var self = this;
  self.peerconnection.createAnswer(constraints).then(answer=>{
    console.log('on create answer success: ', answer.sdp);
    if(successCallback && typeof successCallback == 'function')
      successCallback(answer);
  }).catch(error=>{
    console.error('on create answer failed: ', error);
    if(failureCallback && typeof failureCallback == 'function')
      failureCallback(error);
  });

};

/**
 *
 * @param successCallback
 * @param failureCallback
 * @param constraints
 */
PeerConnectionAdapter.prototype.createOffer
  = function (successCallback, failureCallback, constraints) {
  var self = this;
  self.peerconnection.createOffer(constraints).then(offer=>{
    console.log('on create offer success');
    if(successCallback && typeof successCallback == 'function')
      successCallback(offer);
  }).catch(error=>{
    console.error('on create offer failed: ', error);
    if(failureCallback && typeof failureCallback == 'function')
      failureCallback(error);
  });

};


/**
 * 
 * @param {String} candidate 
 * @param {Function} successCallback 
 * @param {Function} failureCallback 
 */
PeerConnectionAdapter.prototype.addIceCandidate
  = function (candidate, successCallback, failureCallback) {
  var self = this;
  if(navigator.mozGetUserMedia || self.useUnified)
    candidate = self.interop.candidateToUnifiedPlan(candidate);
  else
    candidate = self.interop.candidateToPlanB(candidate);
  if(!self.peerconnection || !self.peerconnection.remoteDescription.type){
  //push candidate onto queue...
    console.warn('remote description not ready yet. ');
  }
  self.peerconnection.addIceCandidate(candidate).then(success=>{
    if(successCallback && typeof successCallback == 'function')
      successCallback(success);
  }).catch(error=>{
    console.error('set ice candidate failed: ', error);
    if(failureCallback && typeof failureCallback == 'function')
      failureCallback(error);
  });
};


/**
 * 
 * @param {Function} callback 
 */
PeerConnectionAdapter.prototype.onicecandidate
  = function (callback) {
  var self = this;
  self.peerconnection.onicecandidate = function(event) {
    let candidate = event.candidate;
    if (candidate) {
      console.log('on candidate from local:', candidate);
      if(callback && typeof callback == 'function')
        callback(candidate);
    } else {
      // All ICE candidates have been sent
      console.info('All ICE candidates have been sent ');
    }
  }
  
};


module.exports = PeerConnectionAdapter;