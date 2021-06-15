


var number = document.querySelectorAll(".drum").length;

for(var i = 0; i<number; i++){
  document.querySelectorAll(".drum")[i].addEventListener( "click" , function (){
   var letter = this.innerHTML;
   makeSound(letter);

   buttonAnimation(letter);
});
}


document.addEventListener("keypress" , function(){
  makeSound(event.key);

  buttonAnimation(event.key);
})


function makeSound(key){

  switch (key) {
    case "w":
         var myAudio = new Audio("sounds/tom-1.mp3");
         myAudio.play();
      break;
     case "a":
           var myAudio = new Audio("sounds/tom-2.mp3");
           myAudio.play();
     break;
     case "s":
         var myAudio = new Audio("sounds/tom-3.mp3");
         myAudio.play();
     break;
     case "d":
         var myAudio = new Audio("sounds/tom-4.mp3");
         myAudio.play();
     break;
     case "j":
         var myAudio = new Audio("sounds/snare.mp3");
         myAudio.play();
     break;
     case "k":
         var myAudio = new Audio("sounds/kick-bass.mp3");
         myAudio.play();
     break;
     case "l":
         var myAudio = new Audio("sounds/crash.mp3");
         myAudio.play();
     break;
  }
}


 function buttonAnimation(keyin)
 {
    var buttonPressed = document.querySelector("."+keyin);
     buttonPressed.classList.add("pressed");

     setTimeout( function (){
       buttonPressed.classList.remove("pressed");
     }, 100)
 }
