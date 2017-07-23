// set up basic variables for app

var record = document.querySelector('.record');
var stop = document.querySelector('.stop');
var soundClips = document.querySelector('.sound-clips');
var canvas = document.querySelector('.visualizer');

// hide elements we don't need
record.style.display = 'none';
stop.style.display = 'none';
canvas.style.display = 'none';

// disable stop button while not recording

stop.disabled = true;

record.onclick = function() {
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


function createClip(clipName, audioURL) {
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

// create new clip element
var clipName = null;
var audioURL = null;
createClip(clipName, audioURL);

var clip = document.querySelector('.clip');

let databaseRef = firebase.database().ref("tmp");

databaseRef.orderByKey().on("child_added", function(snapshot) {
  console.log(snapshot.key);
  console.log(snapshot.val())
  clip.querySelector('audio').src = snapshot.val().downloadURL;
  clip.querySelector('p').textContent = snapshot.val().date;
  console.log(clip.querySelector('audio').src, clip.querySelector('p').textContent);
});




// Save to Firebase

//let storageRef = firebase.storage().ref("tmp").child(time + ".webm")
//let uploadTask = storageRef.put(blob);

//var downloadURL = uploadTask.snapshot.downloadURL;
//console.log("File uploaded: ("+uploadTask.snapshot.totalBytes, "bytes)", downloadURL);



console.log("End of JS");

// IGNORE BELOW

// on-value returns an object so we have to iterate
// doesn't make sense to order by value if values are objects!
// databaseRef.orderByValue().on("value", function(snapshot) {
//   snapshot.forEach(function(data) {
//     console.log(data.key, data.val());
//   });
// });

// once-value outputs all as snapshot object initially and on change, ordered first to last by key it appears
// databaseRef.once('value', function(snapshot) {
//   snapshot.forEach(function(childSnapshot) {
//     var childKey = childSnapshot.key;
//     var childData = childSnapshot.val();
//     console.log(childKey, childData);
//   });
// });

// on-value dumps entire object on value change, and seems like it does initially as well
// databaseRef.on('value', function(snapshot) {
//   console.log(snapshot.val());
// });

// returns all existing Objects starting at earliest, then new
// databaseRef.on('child_added', function(data) {
//   console.log(data.val());
// });

// returns nonsense, don't use this way!
//console.log(databaseRef.orderByChild('date'));

// most obvious way, but unnecessary since push-keys are automatically chronological
// databaseRef.orderByChild("date").on("child_added", function(snapshot) {
//   console.log(snapshot.key, snapshot.val().date);
// });


