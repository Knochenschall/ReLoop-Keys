// reloop - keyfadr

loadAPI(1);

load("Extensions.js");
load("Reloop.js");

DRUMPADS = true;
CNAME = "KeyPad";

host.defineController("ReLoop", "KeyPad", "1.0", "372057e0-248e-11e4-8c21-0800200c9a66");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Reloop KeyPad"], ["Reloop KeyPad"]);
host.addDeviceNameBasedDiscoveryPair(["Reloop KeyPad MIDI 1"], ["Reloop KeyPad MIDI 1"]);
host.defineSysexIdentityReply("F0 7E ?? 06 02 AD F5 ?? ?? F7");
