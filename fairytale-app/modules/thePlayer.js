'use strict';
var MPlayer = require('mplayer');
var _musicMetadata = require('music-metadata');

var DEBUG = true;
var TRACE = true;

class thePlayer {
  constructor(name, position) {
    if (DEBUG) console.log('thePlayer constructor called');
    if (TRACE) console.log('   file to play ' + name + ' / position ' + position);

    this.state = {
      paused: false,
      volume: 50,
      filename: name,
      progress: 0,
      position: position || 0,
      duration: 0
    }

    this.player = new MPlayer()
    this.player.on('stop', this.clear)
    if (TRACE) console.log(this.state);
  }

  playTrack() {
    if (DEBUG) console.log('thePlayer playTrack called ');

    //const { format, common } = await _musicMetadata.parseFile(p, { duration: true })
    this.player.openFile(this.state.filename);
    if (TRACE) console.log('openFile called on ' + this.state.filename);

    this.player.volume(this.state.volume);
    if (TRACE) console.log('volume set to ' + this.state.volume);

    this.player.play();
  }

  rewind() {
    if (DEBUG) console.log('thePlayer rewind called ');
    this.player.seekPercent(parseFloat(this.state.progress - 5))
  }

  fastForward() {
    if (DEBUG) console.log('thePlayer fastForward called ');
    this.player.seekPercent(parseFloat(this.state.progress + 5))
  }

  clear() {
    if (DEBUG) console.log('thePlayer clear called ');
    this.state = {
      paused: false,
      //volume: 50,
      filename: '',
      progress: 0,
      position: 0,
      duration: 0
    }
  }

  updatePosition() {
    if (DEBUG) console.log('thePlayer updatePosition called ');

    const p = this.player.status && this.player.status.position
    if (p) {
      this.state = {
        position: p,
        progress: getPercent(this.state.duration, parseFloat(p))
      }
    }
  }

  quit() {
    if (DEBUG) console.log('thePlayer quit called ');
    exit()
  }

  stop() {
    if (DEBUG) console.log('thePlayer stop called ');
    this.player.stop()
  }

  togglePause() {
    if (DEBUG) console.log('thePlayer togglePause called ');

    if (this.state.paused) {
      this.player.play()
    } else {
      this.player.pause()
    }
    this.state = {
      paused: !this.state.paused
    }
  }

  volumeDown() {
    if (DEBUG) console.log('thePlayer volumeDown called ');
    const newVol = this.state.volume - 5
    this.player.volume(newVol)
    this.setState({ volume: newVol })
  }

  volumeUp() {
    if (DEBUG) console.log('thePlayer volumeUp called ');
    const newVol = this.state.volume + 5
    this.player.volume(newVol)
    this.setState({ volume: newVol })
  }

  onSelect() {
    if (DEBUG) console.log('thePlayer onSelect called ');
    const path = node.getPath(node) || '/';
    if (isFile(path) && isAudio(path)) {
      this.play(path)
    }
  }
}

module.exports = thePlayer;
