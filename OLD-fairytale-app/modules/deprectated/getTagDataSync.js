var getTagDataSync = function(app, tagId){
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var TRACE = app.get('TRACE');

  // this is the path to the file system where the rfid tags are stored
  var rfidTagDir = app.get('rfidTagDir');
  var obj = null;

  if (DEBUG) console.log('function getTagData called');

  var tagStorage = path.join(rfidTagDir, tagId .toUpperCase()+'.json');

  try {
    var obj = jsonfile.readFileSync(tagStorage, 'utf8')
    if (DEBUG) console.log('getting data for tag ' + tagId  + ' from file ' + tagStorage +':');
    if (TRACE) console.log(obj);
    return(obj);
  } catch (ex) {
    console.error('error: reading json file for tag '+tagId+' from '+tagStorage+' failed \nerror message: ' +ex.toString());
    var errCallback = {
      response: 'error',
      message: 'could not read data for tag '+tagId +' from '+tagStorage,
      error: ex.toString()
    };
    return(errCallback);
  }
}
