'use strict';
var MPlayer = require('mplayer');
var _musicMetadata = require('music-metadata');

// GET THE CONFIGURATION
var config = require('../modules/configuration.js');
const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

// This is the wrapper class that wraps the original MPlayer
// it is controlled via the playerController.js which handles
// playlists etc.
class thePlayer {
  constructor(file, position, trackId, trackName, tagId, albumName, nextTrackId, prevTrackId) {
    if (DEBUG) console.log('thePlayer constructor called');

    this.state = {
      paused: false,
      volume: 50,
      filename: file,
      progress: 0,
      position: position || 0,
      duration: 0,
      albumId: tagId || 'UNDEF',
      albumName: albumName || 'UNDEF',
      trackId: trackId || 'UNDEF',
      trackName: trackName || 'UNDEF',
      nextTrackId: nextTrackId || 'UNDEF',
      prevTrackId: prevTrackId || 'UNDEF'
    }

    if (TRACE) console.log(this.state);

    this.player = new MPlayer()
    this.player.on('stop', this.clear)
  }

  // takes a json string to set different states
  setState(stateConf) {
    if (DEBUG) console.log('thePlayer setState called');
    var obj = stateConf;

    this.state = {
      paused: obj.pause || false,
      volume: obj.volume || 50,
      filename: obj.filename || 'UNDEF',
      albumId: obj.tagId || 'UNDEF',
      albumName: obj.albumName || 'UNDEF',
      progress: obj.progress || 0,
      position: obj.position || 0,
      duration: obj.duration || 0,
      trackId: obj.trackId || 'UNDEF',
      trackName: obj.trackName || 'UNDEF',
      nextTrackId: obj.nextTrackId || 'UNDEF',
      prevTrackId: obj.prevTrackId || 'UNDEF'
    };

    if (TRACE) console.log(this.state);
  }
  setPosition(position){
    this.state.position = position;
  }
  setFile(file){
    this.state.filename = file;
  }
  setTrackId(trackId){
    this.state.trackId = trackId;
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
