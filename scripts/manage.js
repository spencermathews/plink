var firebaseRoot = 'tmp';

// set up basic variables for app

var soundClips = document.querySelector('.sound-clips');

var databaseRef = firebase.database().ref(firebaseRoot);
var storageRef = firebase.storage().ref(firebaseRoot);


function createClip(clipName, audioURL) {
  // clipName was here
  var clipContainer = document.createElement('article');
  var clipLabel = document.createElement('p');
  var audio = document.createElement('audio');
  var deleteButton = document.createElement('button');
 
  clipContainer.classList.add('clip');
  audio.setAttribute('controls', '');
  audio.setAttribute('preload', 'metadata');  // prevent auto download
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
    
    // Get audio element attached to this delete button
    var audioElement = evtTgt.parentNode.firstElementChild;
    // Delete src file from database and storage
    if (audioElement.src.includes("blob")) {
      window.URL.revokeObjectURL(audioElement.src);
    } else if (audioElement.src.includes("firebasestorage")){
      var databaseDeleteRef = databaseRef.child(audioElement.dataset.firebaseKey);  // data-firebase-key custom data attribute
      // Delete reference from database
      console.log('Removing', databaseDeleteRef.key);
      databaseDeleteRef.remove().then(function() {
        console.log("Remove succeeded.");
        // trust that the audio element attributes were properly written so that database key and storage name correspond
        var storageDeleteRef = storageRef.child(audioElement.dataset.firebaseName);
        // Delete the file from storage
        console.log('Deleting', storageDeleteRef.name);
        storageDeleteRef.delete().then(function() {
          console.log("Delete succeeded.");
        }).catch(function(error) {
          console.log("Delete failed: " + error.message);
        });
      }).catch(function(error) {
        console.log("Remove failed: " + error.message);
      });
    }
    // Don't remove node here since we clear all clip nodes on every firebase refresh
    //evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
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

  // sets callback for when audio completes
  audio.addEventListener('ended', function (e) {
    console.log('Audio ended: duration', audio.duration);
    evtTgt = e.target;

    // Play next clip if there is one
    try {
      nextAudioElement = evtTgt.parentNode.nextElementSibling.firstElementChild;
      nextAudioElement.play();
    } catch (e) {
      console.log(e);
    }
  }, false);

  audio.addEventListener('play', function (e) {
    evtTgt = e.target;

    console.log('currentSrc:', evtTgt.currentSrc);
    console.log('readyState:', evtTgt.readyState);
    console.log('duration:', evtTgt.duration);
    
    var bufferedTimeRanges = evtTgt.buffered;
    console.log('buffered:', bufferedTimeRanges, bufferedTimeRanges.start(0), bufferedTimeRanges.end(bufferedTimeRanges.length-1));
    var seekableTimeRanges = evtTgt.seekable;
    console.log('seekable:', seekableTimeRanges, seekableTimeRanges.start(0), seekableTimeRanges.end(bufferedTimeRanges.length-1));
  }, false);
  // TODO add listener that stops other audio when play another
  // TODO change color to highlight currently playing
  // TODO print out length of clip in player

  return audio;
}


databaseRef.orderByKey().on("value", function(snapshot) {
  console.log("value on!");

  // Clear all audio clips before rebuilding with current snapshot
  var clips = soundClips.children;
  console.log("Clearing", clips.length, 'clips for refresh');
  // This is the right way to clear all children (may want to use firstChild)
  while(soundClips.firstElementChild) {
    soundClips.removeChild(soundClips.firstElementChild);
  }

  // Create audio elements for each item in the database
  snapshot.forEach(function(childSnapshot) {
    var childData = childSnapshot.val();
    var childKey = childSnapshot.key;
    var audio = createClip(childData.date, childData.downloadURL);
    audio.setAttribute('data-firebase-key', childKey);
    audio.setAttribute('data-firebase-name', childData.name);
  });
  console.log("Number of db entries:", snapshot.numChildren());
});


console.log("End of JS");
