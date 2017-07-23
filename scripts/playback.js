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
  console.log("recorder started");
  record.style.background = "red";

  stop.disabled = false;
  record.disabled = true;
}

stop.onclick = function() {
  record.style.background = "";
  record.style.color = "";

  stop.disabled = true;
  record.disabled = false;
}


function createClip(clipName, downloadURL) {
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

// create new clip element referencing the data on firebase
clipName = "tmp";//d.toISOString();
audioURL = "tmp";//downloadURL;
createClip(clipName, audioURL);


// Save to Firebase

//let storageRef = firebase.storage().ref("tmp").child(time + ".webm")
//let uploadTask = storageRef.put(blob);

//var downloadURL = uploadTask.snapshot.downloadURL;
//console.log("File uploaded: ("+uploadTask.snapshot.totalBytes, "bytes)", downloadURL);

// Store reference to Database
// let data = {
//   time: time,
//   downloadURL: downloadURL,
//   date: d.toISOString()        
// }

let databaseRef = firebase.database().ref("tmp");

databaseRef.once('value', function(snapshot) {
  snapshot.forEach(function(childSnapshot) {
    var childKey = childSnapshot.key;
    var childData = childSnapshot.val();
    console.log(childKey, childData);

  });
});

databaseRef.on('value', function(snapshot) {
  console.log(snapshot.val());
});

databaseRef.on('child_added', function(data) {
  console.log(data.val());
});

console.log(databaseRef.orderByChild('date'));

databaseRef.orderByChild("date").on("child_added", function(data) {
   console.log(data.val().date);
});
databaseRef.orderByChild("date").on("child_added", function(snapshot) {
  console.log(snapshot.key, snapshot.val().date);
});

databaseRef.orderByKey().on("child_added", function(data) {
   console.log(data.key);
});
databaseRef.orderByKey().on("child_added", function(snapshot) {
  console.log(snapshot.key);
});

databaseRef.orderByValue().on("value", function(data) {
   data.forEach(function(data) {
      console.log(data.key, data.val());
   });
});
databaseRef.orderByValue().on("value", function(snapshot) {
  snapshot.forEach(function(data) {
    console.log(data.key, data.val());
  });
});



