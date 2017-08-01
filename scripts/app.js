var firebaseRoot = 'tmp';

// fork getUserMedia for multiple browser versions, for the future
// when more browsers support MediaRecorder

navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);

// set up basic variables for app

var record = document.querySelector('.record');
var stop = document.querySelector('.stop');
var save = document.querySelector('.save');
var soundClips = document.querySelector('.sound-clips');
var canvas = document.querySelector('.visualizer');

// disable stop button while not recording

stop.disabled = true;
save.disabled = true;

// grey out disabled buttons
stop.style.background = "gray";
save.style.background = "gray";

// visualiser setup - create web audio api context and canvas

var audioCtx = new (window.AudioContext || webkitAudioContext)();
var canvasCtx = canvas.getContext("2d");

//main block for doing the audio recording

if (navigator.getUserMedia) {
  console.log('getUserMedia supported.');

  var types = ["video/webm", 
             "audio/webm", 
             "video/webm\;codecs=vp8", 
             "video/webm\;codecs=daala", 
             "video/webm\;codecs=h264", 
             "video/mpeg",
             "audio/ogg",
             "audio/webm\;codecs=opus",
             "audio/ogg\;codecs=opus"];

  for (var i in types) { 
    console.log( "Is " + types[i] + " supported? " + (MediaRecorder.isTypeSupported(types[i]) ? "Maybe!" : "Nope :(")); 
  }

  var constraints = { audio: true };
  var chunks = [];

  var onSuccess = function(stream) {
    var mediaRecorder = new MediaRecorder(stream);

    // mades blob and audioURL local to onSuccess to we can it from save.onclick to upload and then delete
    var blob;
    var audioURL;

    var recordTimeout;
    var TimeOut = 180000;

    visualize(stream);

    record.onclick = function() {
      mediaRecorder.start();
      console.log(mediaRecorder.state);
      console.log(mediaRecorder.mimeType);
      console.log("recorder started");
      record.style.background = "red";
      save.style.background = "gray";
      stop.style.background = "";

      stop.disabled = false;
      save.disabled = true;
      record.disabled = true;

      deleteLastClip();

      // Set timeout to enforce recording time limit by simulating click on stop button
      recordTimeout = setTimeout(function() {stop.click()}, TimeOut);
    }

    stop.onclick = function() {
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
      console.log("recorder stopped");
      record.style.background = "";
      record.style.color = "";
      stop.style.background = "gray";
      save.style.background = "";
      // mediaRecorder.requestData();

      save.disabled = false;
      stop.disabled = true;
      record.disabled = false;

      // Clear the timelimit timeout
      clearTimeout(recordTimeout);
    }

    save.onclick = function() {
      console.log("saving to firebase");
      record.style.background = "";
      stop.style.background = "gray";
      save.style.background = "gray";
      // mediaRecorder.requestData();

      save.disabled = true;
      stop.disabled = true;
      record.disabled = false;

      // Save to Firebase
      console.log("Saving to Firebase");
      var d = new Date();
      var year = d.getFullYear();
      var month = ('0' + (d.getMonth() + 1)).slice(-2);
      var day = ('0' + d.getDate()).slice(-2);
      var hour = d.getHours();
      var min = d.getMinutes();
      var sec = d.getSeconds();
      var time = `${year}-${month}-${day}-${hour}-${min}-${sec}`;

      var name = time + ".webm";
      // for whatever reason blob, which is local to parent function onSuccess, is
      console.log("Uploading blob of size", blob.size, "and type", blob.type);
      let storageRef = firebase.storage().ref(firebaseRoot);
      let uploadTask = storageRef.child(name).put(blob);

      deleteLastClip();

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
        console.log('Upload failed!');
      }, function() {
        // Handle successful uploads on complete
        // For instance, get the download URL: https://firebasestorage.googleapis.com/...
        var downloadURL = uploadTask.snapshot.downloadURL;
        console.log("File uploaded: ("+uploadTask.snapshot.totalBytes, "bytes)", downloadURL);

        // Store reference to Database
        let data = {
          time: time,
          downloadURL: downloadURL,
          date: d.toISOString(),
          name: name
        }

        let databaseRef = firebase.database().ref(firebaseRoot).push(data);

        // create new clip element referencing the data on firebase
        clipName = d.toISOString();
        //console.log(clipName);
        //var blob = new Blob(chunks, { 'type' : 'audio/webm; codecs=opus' });
        //chunks = [];
        audioURL = downloadURL;
        createClip(clipName, audioURL);
      });
    }

    function deleteLastClip() {
      var clip = soundClips.lastElementChild;  // when used lastElement then got text node of comments, even though soundClips.children.length was 0! Looks like childElementCount would be better
      if(clip) {
        window.URL.revokeObjectURL(clip.firstElementChild.src);  // this should be equal to audioURL at this point, not a problem if we end up calling on a URL that is not a blob
        soundClips.removeChild(clip);  // should not throw error even if there is no last child
        // we might be tempted to null blob here, but not necessary since we're reusing the blob variable
      }
    }

    // triggered when stop button stops the MediaRecorder
    mediaRecorder.onstop = function(e) {
      console.log("data available after MediaRecorder.stop() called.");

      var clipName = ''; //prompt('Enter a name for your sound clip?','My unnamed clip');
      //console.log(clipName);
      blob = new Blob(chunks, { 'type' : 'audio/webm; codecs=opus' });
      chunks = [];
      audioURL = window.URL.createObjectURL(blob);
      createClip(clipName, audioURL).play();
    }

    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data);
    }
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
    console.log("recorder stopped");

    deleteButton.onclick = function(e) {
      evtTgt = e.target;
      evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);

      // added to allow garbage collection of blobs
      // variable binding seems to occur and persist, so we can reference audioURL and deleteButton
      // and they will refer to the values current on binding!?
      // we'd also want to null blob if there were more references to it around
      // all three ways of obtaining src are equivalent and equal to originally audioURL
      // note must get src before removing elements but not if using audioURL 
      //let src = evtTgt.parentNode.querySelector("audio").src;
      //let src = this.parentNode.querySelector("audio").src;
      //let src = deleteButton.parentNode.querySelector("audio").src;
      // console.log(src, audioURL);
      // if (src.includes("blob")) {
      //   window.URL.revokeObjectURL(src);
      // }
      if (audioURL.includes("blob")) {
        window.URL.revokeObjectURL(audioURL);
      }
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
    return audio;
  }

  var onError = function(err) {
    console.log('The following error occured: ' + err);
  }

  navigator.getUserMedia(constraints, onSuccess, onError);
} else {
   console.log('getUserMedia not supported on your browser!');
}

function visualize(stream) {
  var source = audioCtx.createMediaStreamSource(stream);

  var analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  var bufferLength = analyser.frequencyBinCount;
  var dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  //analyser.connect(audioCtx.destination);
  
  WIDTH = canvas.width
  HEIGHT = canvas.height;

  draw()

  function draw() {

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    var sliceWidth = WIDTH * 1.0 / bufferLength;
    var x = 0;


    for(var i = 0; i < bufferLength; i++) {
 
      var v = dataArray[i] / 128.0;
      var y = v * HEIGHT/2;

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height/2);
    canvasCtx.stroke();

  }
}

