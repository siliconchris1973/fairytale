'use strict';
var MPlayer = require('mplayer');
var _musicMetadata = require('music-metadata');

// This is the wrapper class that wraps the original MPlayer
// it is controlled via the playerController.js which handles
// playlists etc.
class thePlayer {
  constructor(name, position) {
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
  }

  playTrack() {
    //const { format, common } = await _musicMetadata.parseFile(p, { duration: true })
    this.player.openFile(this.state.filename);
    this.player.volume(this.state.volume);
    this.player.play();
  }

  rewind() {
    this.player.seekPercent(parseFloat(this.state.progress - 5))
  }

  fastForward() {
    this.player.seekPercent(parseFloat(this.state.progress + 5))
  }

  clear() {
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
    const p = this.player.status && this.player.status.position
    if (p) {
      this.state = {
        position: p,
        //progress: getPercent(this.state.duration, parseFloat(p))
      }
    }
  }

  getPosition() {
    return(this.player.status.position);
  }

  quit() {
    exit()
  }

  stop() {
    this.updatePosition();
    this.player.stop()
  }

  togglePause() {
    if (this.state.paused) {
      this.player.play()
    } else {
      this.updatePosition();
      this.player.pause()
    }
    this.state = {
      paused: !this.state.paused
    }
  }

  volumeDown() {
    const newVol = this.state.volume - 5
    this.player.volume(newVol)
    this.setState({ volume: newVol })
  }

  volumeUp() {
    const newVol = this.state.volume + 5
    this.player.volume(newVol)
    this.setState({ volume: newVol })
  }

  onSelect() {
    const path = node.getPath(node) || '/';
    if (isFile(path) && isAudio(path)) {
      this.play(path)
    }
  }
}

module.exports = thePlayer;
