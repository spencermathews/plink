var audio = new Audio(); // HTMLAudioElement interface
audio.src = "https://archive.org/download/gd1974-06-20.sbd.remaster.105427.flac16/gd74-06-20d1t11.mp3"; // HTMLMediaElement.src property

var play = document.getElementById("play");
// var play = document.querySelector("#play");

play.addEventListener("click", function() {
  // console.log("click");

  this.classList.toggle("active");
  // console.log(this.classList.toString());

  if (this.classList.contains("active")) {
    audio.play(); // HTMLMediaElement.play(), returns Promise
    this.innerHTML = "Pause";

  } else {
    audio.pause() // HTMLMediaElement.pause()
    this.innerHTML = "Play";
  }
});