// reloop - keyfadr

loadAPI(1);

load("Extensions.js");
load("Reloop.js");

DRUMPADS = false;
CNAME = "KeyFadr";

host.defineController("ReLoop", "KeyFadr", "1.0", "cb1eb430-23b4-11e4-8c21-0800200c9a66");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Reloop KeyFadr"], ["Reloop KeyFadr"]);
host.addDeviceNameBasedDiscoveryPair(["Reloop KeyFadr MIDI 1"], ["Reloop KeyFadr MIDI 1"]);
