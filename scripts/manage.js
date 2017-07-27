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
  //audio.setAttribute('autoplay', '');
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

// creates and initializes audio element
var audioURL = '';  // if null will try to fetch and give 404, even if not playing
var clipName = 'Nothing here yet';
createClip(clipName, audioURL);

var audio = document.querySelector('audio');

// sets callback for when audio completes
audio.addEventListener('ended', function (e) {
  //audio.currentTime = 0;  // may be necessary or else callback might only be called once, and may be necessary to pause before
  console.log('Audio ended: duration', audio.duration);
  audio.pause();  // may not be necessary

  if (currentIndex > 0) {
    currentIndex--;
  } else {
    currentIndex = urls.length-1;
  }
  var audioURL = urls[currentIndex].downloadURL;
  var clipName = urls[currentIndex].date;
  console.log("Next audio ["+currentIndex+"]", clipName, audioURL);
  audio.src = audioURL;
  audio.nextSibling.textContent = clipName;  // next sibling is p

  audio.play();
}, false);


var databaseRef = firebase.database().ref("tmp");

// saves audio metadata objects in chronological order as they are added to firebase
var urls = [];
var currentIndex;  // index of audio currently playing, is set to 0 when more audio recieved and we need to start at the top


// reads database once and initialize things
// using ref.on is asynchronous and I'm not ready to commit to a fuzzy start up
databaseRef.orderByKey().once("value", function(snapshot) {
  console.log("value once!")
  // ugly but correct way to clear array
  urls.splice(0,urls.length);
  // forEach is necessary to ensure ordering
  snapshot.forEach(function(childSnapshot) {
    // adds next audio to urls array
    urls.push(childSnapshot.val());
  });
  //console.log("Number of db entries:", snapshot.numChildren());
  //console.log("Size of urls array:", urls.length);

  currentIndex = urls.length-1;
  var audioURL = urls[currentIndex].downloadURL;
  var clipName = urls[currentIndex].date;
  console.log("First audio ["+currentIndex+"]", clipName, audioURL);
  audio.src = audioURL;
  audio.nextSibling.textContent = clipName;  // next sibling is p

  audio.play();
});

databaseRef.orderByKey().on("value", function(snapshot) {
  console.log("value on!");
  // ugly but right way to clear array
  urls.splice(0,urls.length);
  snapshot.forEach(function(childSnapshot) {
    urls.push(childSnapshot.val());
  });
  console.log("Number of db entries:", snapshot.numChildren());
  console.log("Size of urls array:", urls.length);

  // reset current index to 0 so we restart at last index (most recent) next 
  resetIndex();
});

function resetIndex() {
   currentIndex = 0;
}

console.log("End of JS");
