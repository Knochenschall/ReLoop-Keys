// reloop - keyfadr

loadAPI(1);

load("Extensions.js");
load("Reloop.js");

DRUMPADS = true;
CNAME = "KeyPad";

host.defineController("ReLoop", "KeyPad", "1.0", "372057e0-248e-11e4-8c21-0800200c9a66");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Reloop KeyPad"], ["Reloop KeyPad"]);
