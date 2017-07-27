// set up basic variables for app

var soundClips = document.querySelector('.sound-clips');


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
    console.log('readyState:', evtTgt.readyState);
    var bufferedTimeRanges = evtTgt.buffered;
    console.log('buffered:', bufferedTimeRanges, bufferedTimeRanges.start(0), bufferedTimeRanges.end(bufferedTimeRanges.length-1));
    var seekableTimeRanges = evtTgt.seekable;
    console.log('seekable:', seekableTimeRanges, seekableTimeRanges.start(0), seekableTimeRanges.end(bufferedTimeRanges.length-1));
  }, false);
  // TODO add listener that stops other audio when play another
  // TODO change color to highlight currently playing
  // TODO print out length of clip in player
}


var databaseRef = firebase.database().ref("tmp");

databaseRef.orderByKey().on("value", function(snapshot) {
  console.log("value on!");
  snapshot.forEach(function(childSnapshot) {
    childData = childSnapshot.val();
    createClip(childData.date, childData.downloadURL);
  });
});

console.log("End of JS");
