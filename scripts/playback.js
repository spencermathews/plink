// fork getUserMedia for multiple browser versions, for the future
// when more browsers support MediaRecorder

// navigator.getUserMedia = ( navigator.getUserMedia ||
//                        navigator.webkitGetUserMedia ||
//                        navigator.mozGetUserMedia ||
//                        navigator.msGetUserMedia);

// set up basic variables for app

var record = document.querySelector('.record');
var stop = document.querySelector('.stop');
var soundClips = document.querySelector('.sound-clips');
var canvas = document.querySelector('.visualizer');

// disable stop button while not recording

stop.disabled = true;



record.onclick = function() {
  mediaRecorder.start();
  console.log(mediaRecorder.state);
  console.log(mediaRecorder.mimeType);
  console.log("recorder started");
  record.style.background = "red";

  stop.disabled = false;
  record.disabled = true;
}

stop.onclick = function() {
  mediaRecorder.stop();
  console.log(mediaRecorder.state);
  console.log("recorder stopped");
  record.style.background = "";
  record.style.color = "";
  // mediaRecorder.requestData();

  stop.disabled = true;
  record.disabled = false;
}


function createClip(clipName, blob) {
  // clipName was here
  var clipContainer = document.createElement('article');
  var clipLabel = document.createElement('p');
  var audio = document.createElement('audio');
  var deleteButton = document.createElement('button');
 
  clipContainer.classList.add('clip');
  audio.setAttribute('controls', '');
  deleteButton.textContent = 'Delete';
  deleteButton.className = 'delete';

  if(clipName === null) {
    clipLabel.textContent = 'My unnamed clip';
  } else {
    clipLabel.textContent = clipName;
  }

  clipContainer.appendChild(audio);
  clipContainer.appendChild(clipLabel);
  clipContainer.appendChild(deleteButton);
  soundClips.appendChild(clipContainer);

  audio.controls = true;
  // blob was here
  // audioURL was here
  audio.src = audioURL;
  console.log("recorder stopped");

  deleteButton.onclick = function(e) {
    evtTgt = e.target;
    evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
  }

  clipLabel.onclick = function() {
    var existingName = clipLabel.textContent;
    var newClipName = prompt('Enter a new name for your sound clip?');
    if(newClipName === null) {
      clipLabel.textContent = existingName;
    } else {
      clipLabel.textContent = newClipName;
    }
  }
}
var clipName = 'My unnamed clip'; //prompt('Enter a name for your sound clip?','My unnamed clip');
//console.log(clipName);
var blob = new Blob(chunks, { 'type' : 'audio/webm; codecs=opus' });
chunks = [];
var audioURL = window.URL.createObjectURL(blob);
createClip(clipName, blob);

// Save to Firebase
console.log("Saving to Firebase");
var d = new Date();
var year = d.getFullYear();
var month = d.getMonth();
var day = d.getDate();
var hour = d.getHours();
var min = d.getMinutes();
var sec = d.getSeconds();
let time = `${year}-${month}-${day}-${hour}-${min}-${sec}`;

let storageRef = firebase.storage().ref("tmp").child(time + ".webm")
let uploadTask = storageRef.put(blob);

// from https://firebase.google.com/docs/storage/web/upload-files, see also https://firebase.google.com/docs/reference/js/firebase.storage.UploadTask
// Register three observers:
// 1. 'state_changed' (firebase.storage.TaskEvent.STATE_CHANGED) observer, called any time the state changes
// 2. Error observer, called on failure
// 3. Completion observer, called on successful completion
uploadTask.on('state_changed', function(snapshot){
  // Observe state change events such as progress, pause, and resume
  // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
  var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
  console.log('Upload is ' + progress + '% done');
  switch (snapshot.state) {
    case firebase.storage.TaskState.PAUSED: // or 'paused'
      console.log('Upload is paused');
      break;
    case firebase.storage.TaskState.RUNNING: // or 'running'
      console.log('Upload is running');
      break;
  }
}, function(error) {
  // Handle unsuccessful uploads
}, function() {
  // Handle successful uploads on complete
  // For instance, get the download URL: https://firebasestorage.googleapis.com/...
  var downloadURL = uploadTask.snapshot.downloadURL;
  console.log("File uploaded: ("+uploadTask.snapshot.totalBytes, "bytes)", downloadURL);

  // Store reference to Database
  let data = {
    time: time,
    downloadURL: downloadURL,
    date: d.toISOString()        
  }

  let databaseRef = firebase.database().ref("tmp").push(data);

  // create new clip element referencing the data on firebase
  clipName = d.toISOString();
  //console.log(clipName);
  //var blob = new Blob(chunks, { 'type' : 'audio/webm; codecs=opus' });
  //chunks = [];
  audioURL = downloadURL;
  createClip(clipName, blob);
});


