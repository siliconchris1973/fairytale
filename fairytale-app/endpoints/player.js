var playerProto = 'http';
var playerAddr = 'deepthought';
var playerPort = '3002';
var playerApi = '/api/v1';
var playerUrl = '/player';
var playerEndpoints = {endpoints: [
  {
    shortcut: 'info',
    endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/info',
    description: 'the root entry of the mp3 player API',
    alive: 'true'
  },
  {
    shortcut: 'play',
    endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/play',
    description: 'play a given mp3 file'
  },
  {
    shortcut: 'stop',
    endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/stop',
    description: 'stop playing'
  },
  {
    shortcut: 'pause',
    endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/pause',
    description: 'pause playback'
  },
  {
    shortcut: 'skip',
    endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/skip',
    description: 'skip 10 seconds of played file'
  },
  {
    shortcut: 'forward',
    endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/forward',
    description: 'fast forward in current file'
  },
  {
    shortcut: 'rewind',
    endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/rewind',
    description: 'rewind in current file'
  },
  {
    shortcut: 'next',
    endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/next',
    description: 'jump to next file for currently played album'
  },
  {
    shortcut: 'previous',
    endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/prev',
    description: 'jump to previous file of currently played album'
  }
]};
