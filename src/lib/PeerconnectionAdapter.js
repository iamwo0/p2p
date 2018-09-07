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
  if (navigator.mozGetUserMedia || self.useUnified)
    description = this.interop.toUnifiedPlan(description);

  this.peerconnection.setLocalDescription(description,
    function () { successCallback(); },
    function (err) { failureCallback(err); }
  );
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
    description = this.interop.toUnifiedPlan(description);

  this.peerconnection.setRemoteDescription(description,
    function () { successCallback(); },
    function (err) { failureCallback(err); }
  );
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
  this.peerconnection.createAnswer(
    function (answer) {
      if (navigator.mozGetUserMedia || !self.useUnified)
        answer = self.interop.toPlanB(answer);
      successCallback(answer);
    },
    function(err) {
      failureCallback(err);
    },
    constraints
  );

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
  this.peerconnection.createOffer(
    function (offer) {
      if (navigator.mozGetUserMedia || !self.useUnified)
        offer = self.interop.toPlanB(offer);
      successCallback(offer);
    },
    function(err) {
      failureCallback(err);
    },
    constraints
  );

};


module.exports = PeerConnectionAdapter;