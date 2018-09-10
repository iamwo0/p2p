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
    const Interop = require('sdp-interop').Interop;
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
  // if we're running on FF, transform to Unified Plan first.
  console.log('set local description before: \n', description.sdp);
  if (navigator.mozGetUserMedia || self.useUnified)
    description = self.interop.toUnifiedPlan(description);
  else
    description = self.interop.toPlanB(description);
  console.log('set local description after: \n', description.sdp);
  // this.peerconnection.setLocalDescription(description,
  //   function () { successCallback(); },
  //   function (err) { failureCallback(err); }
  // );
  self.peerconnection.setLocalDescription(description).then(success=>{
    console.log('on set local description success: ', success);
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
  console.log('set remote description before: \n', description.sdp);
  if (navigator.mozGetUserMedia || self.useUnified)
    description = self.interop.toUnifiedPlan(description);
  else
    description = self.interop.toPlanB(description);
  console.log('set remote description after: \n', description.sdp);
  // this.peerconnection.setRemoteDescription(description,
  //   function () { successCallback(); },
  //   function (err) { failureCallback(err); }
  // );
  self.peerconnection.setRemoteDescription(description).then(success=>{
    console.log('on set remote description success: ', success);
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
  // this.peerconnection.createAnswer(
  //   function (answer) {
  //     console.log('create answer before: \n', answer);
  //     if (navigator.mozGetUserMedia || !self.useUnified)
  //       answer = self.interop.toPlanB(answer);
  //     console.log('create answer after: \n', answer);
  //     successCallback(answer);
  //   },
  //   function(err) {
  //     failureCallback(err);
  //   },
  //   constraints
  // );
  self.peerconnection.createAnswer(constraints).then(answer=>{
    console.log('on create answer success: ', answer.sdp);
    if (navigator.mozGetUserMedia || !self.useUnified)
      answer = self.interop.toPlanB(answer);
    console.log('on create answer after plan B: \n', answer.sdp);
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
  // this.peerconnection.createOffer(
  //   function (offer) {
  //     console.log('create offer before: \n', offer);
  //     if (navigator.mozGetUserMedia || !self.useUnified)
  //       offer = self.interop.toPlanB(offer);
  //     console.log('create offer after: \n', offer);
  //     successCallback(offer);
  //   },
  //   function(err) {
  //     failureCallback(err);
  //   },
  //   constraints
  // );
  self.peerconnection.createOffer(constraints).then(offer=>{
    console.log('on create offer success: ', offer.sdp);
    if (navigator.mozGetUserMedia || !self.useUnified)
      offer = self.interop.toPlanB(offer);
    console.log('on create offer after to plan B: \n', offer.sdp);
    if(successCallback && typeof successCallback == 'function')
      successCallback(offer);
  }).catch(error=>{
    console.error('on create offer failed: ', error);
    if(failureCallback && typeof failureCallback == 'function')
      failureCallback(error);
  });

};


module.exports = PeerConnectionAdapter;