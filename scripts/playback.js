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


var databaseRef = firebase.database().ref("tmp");

// saves audio metadata objects in chronological order as they are added to firebase
var urls = [];
var currentIndex;  // index of audio currently playing, is set to 0 when more audio recieved and we need to start at the top

function resetIndex() {
   currentIndex = 0;
}

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

  // creates and initializes audio element
  currentIndex = urls.length-1;
  var audioURL = urls[currentIndex].downloadURL;
  var clipName = urls[currentIndex].date;
  createClip(clipName, audioURL);
  console.log("First audio ["+currentIndex+"]", clipName, audioURL);

  var audio = document.querySelector('audio');
  audio.play();

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

console.log("End of JS");

// IGNORE BELOW

// perhaps a more clever proach could include using child_added instead of value callback so only new entries are returned
// but that would require manicuring urls array manually instead of just dumping it from the snapshot
// databaseRef.orderByKey().on("child_added", function(snapshot) {
//   //console.log(snapshot.key);
//   //console.log(snapshot.val());

//   // add new database object with downloadURL and date properties
//   urls.push(snapshot.val());

//   console.log(currentURLIndex, '/', snapshot.numChildren());

//   //var downloadURL = snapshot.val().downloadURL;
//   //var date = snapshot.val().date;
//   // immediately updates player with new file
//   //clip.querySelector('audio').src = downloadURL;
//   //clip.querySelector('p').textContent = date;
//   //console.log(clip.querySelector('audio').src, clip.querySelector('p').textContent);
// });

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


