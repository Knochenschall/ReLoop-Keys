// ReLoop Main Module

var RL = null;

function ReLoop() {
   // Create Midi Ports and Settings:
   this.keys = host.getMidiInPort(0).createNoteInput(CNAME + " Keys", "?0????", "?1????", "?2????");
   this.keys.setShouldConsumeEvents(false);
   if (DRUMPADS) {
      this.pads = host.getMidiInPort(0).createNoteInput(CNAME + " Pads", "?4????");
      this.pads.setShouldConsumeEvents(false);
   }
 	host.getMidiOutPort(0).setShouldSendMidiBeatClock(true);
   host.getMidiInPort(0).setMidiCallback(onMidi);
   host.getMidiInPort(0).setSysexCallback(onSysex);

   // Midi CC Constants:
   this.knob1 =    [57, 58, 59, 60, 61, 62, 63, 64];
   this.knob1S =   [65, 66, 67, 68, 69, 70, 71, 72];
   this.knob2 =    [89, 90, 91, 92, 93, 94, 95, 96];
   this.knob3 =    [97, 98, 99, 100, 101, 102, 103, 104];
   this.fader =    [0, 1, 2, 3, 4, 5, 6, 7];
   this.button1 =  [8, 9, 10, 11, 12, 13, 14, 15];
   this.button1S = [16, 17, 18, 19, 20, 21, 22, 23];
   this.button2 =  [24, 25, 26, 27, 28, 29, 30, 31];
   this.button2S = [32, 33, 34, 35, 36, 37, 38, 39];
   this.button3 =  [40, 41, 42, 43, 44, 45, 46, 47];
   this.button3S = [49, 50, 51, 52, 53, 54, 55, 56];
   this.play = 105;
   this.playS = 108;
   this.stop = 106;
   this.stopS = 109;
   this.record = 107;
   this.recordS = 110;
   this.octaveDownS = 111;
   this.octaveUpS = 112;
   this.channel1 = 177;
   this.channel2 = 178;
   this.mute = [];
   this.solo = [];
   this.arm = [];
   this.nextPageEnabled = true;

   // State Variables:
   this.isPlaying = false;
   this.isRecording = false;

   this.pageNames = [];
   this.pageNumber = 0;
   this.pageCount = null;

   // Creating Views:
   this.transport = host.createTransport();
   this.tracks = host.createTrackBank(8, 2, 8);
   this.cTrack = host.createCursorTrack(3, 0);
   this.cDevice = this.cTrack.getPrimaryDevice();


   // Set Indications:
   for (var i = 0; i < 8; i++) {
      this.tracks.getTrack(i).getPan().setIndication(true);
      this.tracks.getTrack(i).getSend(0).setIndication(true);
      this.tracks.getTrack(i).getSend(1).setIndication(true);
      this.tracks.getTrack(i).getVolume().setIndication(true);
      this.tracks.getTrack(i).getClipLauncher().setIndication(true);
      this.cDevice.getMacro(i).getAmount().setIndication(true);
      this.cDevice.getEnvelopeParameter(i).setIndication(true);
      this.cDevice.getCommonParameter(i).setIndication(true);
      this.cDevice.getParameter(i).setIndication(true);
   }

   // User Controls:
   this.LOWEST_CC = 0;
   this.HIGHEST_CC = 119;
   this.uControls = host.createUserControlsSection(this.HIGHEST_CC - this.LOWEST_CC + 1);
   for (var i = this.LOWEST_CC; i <= this.HIGHEST_CC; i++) {
      this.uControls.getControl(i - this.LOWEST_CC).setLabel("CC" + i);
   }

   // Observers:
   this.transport.addIsPlayingObserver(function (on) {
      this.isPlaying = on;
      sendMidi(177 , this.play, on ? 127 : 0);
   });
   this.transport.addIsRecordingObserver(function (on) {
      this.isRecording = on;
      sendMidi(177 , this.record, on ? 127 : 0);
   });

   this.cDevice.addNextParameterPageEnabledObserver(function(on) {
      this.nextPageEnabled = on;
      //println(on);
   });
   this.cDevice.addPreviousParameterPageEnabledObserver(function(on) {
      //println(on);
   });
   this.cDevice.addPageNamesObserver(function(names) {
      pageNames = [];
      for(var l = 0; l < arguments.length; l++) {
         pageNames[l] = arguments[l];
      }
      pageCount = l;
   })
   this.cDevice.addSelectedPageObserver(0, function(page) {
      pageNumber = page;
   })

   for (var j = 0; j < 8; j++) {
      this.tracks.getTrack(j).getMute().addValueObserver( buttonObserver(j, this.mute, this.button1 ) );
      this.tracks.getTrack(j).getSolo().addValueObserver( buttonObserver(j, this.solo, this.button2 ) );
      this.tracks.getTrack(j).getArm().addValueObserver( buttonObserver(j, this.arm, this.button3 ) );
   }


   return this;
}

function buttonObserver(index, valueToSet, button) {
   return function (on) {
      valueToSet[index] = on;
      sendMidi(RL.channel1, button[index], on ? 127 : 0);
      sendMidi(RL.channel2, button[index], on ? 127 : 0);
   };
}

function init() {
   // Instatiate the main object:
   RL = ReLoop();

   if (CNAME === "KeyPad") {
      sendSysex("F0 AD F5 01 11 02 F7");
   }
   else if (CNAME === "KeyFadr") {
      sendSysex("F0 AD F6 01 11 02 F7");
   }
}

function onMidi(status, data1, data2) {
   // Instantiate the MidiData Object for convenience:
   var midi = new MidiData(status, data1, data2);

   // Print Midi Input to Console
   //printMidi(status, data1, data2);
   //println(midi.channel());

   if (midi.isChannelController()) {
      // Transport:
      // Play:
      if (midi.data1 === RL.play) {
         if (midi.isOn()) RL.transport.play() ;
      }
      // Stop:
      else if (midi.data1 === RL.stop) {
         if (midi.isOn()) RL.transport.stop() ;
         sendMidi(177 , RL.record, RL.isRecording ? 127 : 0);
      }
      // Stop All Clips:
      else if (midi.data1 === RL.stopS) {
         if (midi.isOn()) RL.tracks.getClipLauncherScenes().stop();
      }
      // Record Enable:
      else if (midi.data1 === RL.record) {
         if (midi.isOn()) RL.transport.record() ;
      }
      // Toggle Overdub:
      else if (midi.data1 === RL.recordS) {
         if (midi.isOn()) RL.transport.toggleOverdub();
      }
      // Toggle Metronome:
      else if (midi.data1 === RL.button3S[5]) {
         if (midi.isOn()) RL.transport.toggleClick();
      }
      // Toggle Loop:
      else if (midi.data1 === RL.button3S[3]) {
         if (midi.isOn()) RL.transport.toggleLoop();
      }
      // Launch Scene:
      else if (midi.data1IsInRange8(RL.button1S[0])) {
         var index = midi.data1 - RL.button1S[0];
         RL.tracks.launchScene(index);
         sendMidi(midi.status, RL.button1[index], RL.mute[index] ? 127 : 0);
      }
      // Scroll Scenes Up:
      else if (midi.data1 === RL.octaveDownS) {
         if (midi.isOn()) RL.tracks.scrollScenesUp();
      }
      // Scroll Scenes Down:
      else if (midi.data1 === RL.octaveUpS) {
         if (midi.isOn()) RL.tracks.scrollScenesDown();
      }
      // Mute:
      else if (midi.data1IsInRange8(RL.button1[0])) {
         var index = midi.data1 - RL.button1[0];
         RL.tracks.getTrack(index).getMute().set(midi.data2 > 64 ? true : false);
      }
      // Solo:
      else if (midi.data1IsInRange8(RL.button2[0])) {
         var index = midi.data1 - RL.button2[0];
         if (midi.isOn()) {
            RL.tracks.getTrack(index).getSolo().toggle();
         }
         else {
            sendMidi(RL.channel1, midi.data1, RL.solo[index] ? 127 : 0);
            sendMidi(RL.channel2, midi.data1, RL.solo[index] ? 127 : 0);
         }
      }
      // Arm:
      else if (midi.data1IsInRange8(RL.button3[0])) {
         var index = midi.data1 - RL.button3[0];
         if (midi.isOn()) {
            RL.tracks.getTrack(index).getArm().toggle();
         }
         else {
            sendMidi(RL.channel1, midi.data1, RL.arm[index] ? 127 : 0);
            sendMidi(RL.channel2, midi.data1, RL.arm[index] ? 127 : 0);
         }
      }
      // Scene 1:
      if (midi.channel() === 1) {
         // Pan:
         if (midi.data1IsInRange8(RL.knob1[0])) {
            var index = midi.data1 - RL.knob1[0];
            RL.tracks.getTrack(index).getPan().set(midi.data2, 127);
         }
         // Sends:
         else if (midi.data1IsInRange8(RL.knob2[0])) {
            var index = midi.data1 - RL.knob2[0];
            RL.tracks.getTrack(index).getSend(0).set(midi.data2, 128);
         }
         else if (midi.data1IsInRange8(RL.knob3[0])) {
            var index = midi.data1 - RL.knob3[0];
            RL.tracks.getTrack(index).getSend(1).set(midi.data2, 128);
         }
         // Fader:
         else if (midi.data1IsInRange8(RL.fader[0])) {
            var index = midi.data1 - RL.fader[0];
            RL.tracks.getTrack(index).getVolume().set(midi.data2, 128);
         }
         // Scroll Tracks Up:
         else if (midi.data1 === RL.button3S[6]) {
            if (midi.isOn()) RL.tracks.scrollTracksUp();
         }
         // Scroll Tracks Down:
         else if (midi.data1 === RL.button3S[7]) {
            if (midi.isOn()) RL.tracks.scrollTracksDown();
         }
         //User Controls:
         if (midi.data1IsInRange(RL.LOWEST_CC, RL.HIGHEST_CC)) {
            var index = midi.data1 - RL.LOWEST_CC;
            RL.uControls.getControl(index).set(data2, 128);
         }
      }
      // Scene 2:
      else if (midi.channel() === 2) {
         // Cursor Track Previous:
         if (midi.data1 === RL.button3S[6]) {
            if (midi.isOn()) RL.cTrack.selectPrevious();
         }
         // Cursor Track Next:
         else if (midi.data1 === RL.button3S[7]) {
            if (midi.isOn()) RL.cTrack.selectNext();
         }
         // Cursor Device Previous:
         if (midi.data1 === RL.button3S[1]) {
            if (midi.isOn()) RL.cDevice.switchToDevice(DeviceType.ANY,ChainLocation.PREVIOUS);
         }
         // Cursor Device Next:
         else if (midi.data1 === RL.button3S[2]) {
            if (midi.isOn()) RL.cDevice.switchToDevice(DeviceType.ANY,ChainLocation.NEXT);
         }
         // Next Parameter Page:
         else if (midi.data1 === RL.button3S[0]) {
            if (midi.isOn()) {
               //println(RL.nextPageEnabled);
               if (RL.pageNumber < (RL.pageCount-1)) {
                  RL.cDevice.nextParameterPage();
               }
               else {
                  RL.cDevice.setParameterPage(0);
               }
            }
         }
         // Macros:
         else if (midi.data1IsInRange8(RL.knob1[0])) {
            var index = midi.data1 - RL.knob1[0];
            RL.cDevice.getMacro(index).getAmount().set(midi.data2, 127);
         }
         // Common Parameters:
         else if (midi.data1IsInRange8(RL.knob2[0])) {
            var index = midi.data1 - RL.knob2[0];
            RL.cDevice.getCommonParameter(index).set(midi.data2, 128);
         }
         // Parameters:
         else if (midi.data1IsInRange8(RL.knob3[0])) {
            var index = midi.data1 - RL.knob3[0];
            RL.cDevice.getParameter(index).set(midi.data2, 128);
         }
         // Envelope Parameters
         else if (midi.data1IsInRange8(RL.fader[0])) {
            var index = midi.data1 - RL.fader[0];
            RL.cDevice.getEnvelopeParameter(index).set(midi.data2, 128);
         }

      }
   }
}

function onSysex(data) {
   printSysex (data);
}

function exit()
{
   //nothing to do here ;-)
}
