


var timer_stopped = true;
var manche = 1;

function printTimer(duration, display) {
    var timer = duration, minutes, seconds;

        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;
}




function startTimer(duration, display) {
    var timer = duration, minutes, seconds;
    var this_manche = manche;
    timer_stopped = true;
    setInterval(function () {
        if(!timer_stopped){

            if(this_manche != manche){
                return;
            }

        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            timer_stopped = true;
            return;
        }
        }
    }, 1000);
}

var fiveMinutes = 60 * 2.5; //150

window.onload = function () {
    var fiveMinutes = 60 * 2.5,
        display = document.querySelector('#time');
    startTimer(fiveMinutes, display);
};


console.log(manche);







let prices = [0,50,100,200,400,600,1000,1500,3000,5000];
let scale = 0;
let bank = 0;
let bankElement = document.getElementById("bank");

function ResetAll(){
    for (let index = 1; index < prices.length; index++) {
        
        document.getElementById("card"+index).classList.remove('active');
        
    }
}

document.addEventListener('keyup', (e) => {
  if (e.key === "v"){ //(e.key === "v" && !timer_stopped){
    if(scale == prices.length){
        ResetAll();
        bank = bank + prices[scale-1];
        scale = 1;
        document.getElementById("bank").innerHTML = " "+bank;
        document.getElementById("card"+scale).classList.add('active');
    }
    if(scale <= prices.length){
        //console.log(scale);
        //console.log(prices.length);
        if(scale != 0) document.getElementById("card"+scale).classList.add('active');
        if(scale > 1) document.getElementById("card"+(scale-1)).classList.remove('active');
        scale++;
    }else{
        scale = 0;
        document.getElementById("card8").classList.remove('active');
    }
  }
  if (e.key === "b"){
    ResetAll();
    bank = bank + prices[scale-2];
    scale = 1;
    document.getElementById("bank").innerHTML = " "+bank;
    document.getElementById("card"+scale).classList.add('active');
    scale++;
    //document.getElementById("bank").innerHTML = bank;
  }
  if (e.key === "n"){
    ResetAll();
    scale = 1;
    document.getElementById("bank").innerHTML = " "+bank;
    document.getElementById("card"+scale).classList.add('active');
    scale++;
    //document.getElementById("bank").innerHTML = bank;
  }
  if (e.key === "p"){
    if(timer_stopped){
        timer_stopped = false;
    }else{
        timer_stopped = true;
    }
  }
  if (e.key === "s" && timer_stopped){
    manche++;
    fiveMinutes = fiveMinutes - 10;
    display = document.querySelector('#time');
    printTimer(fiveMinutes, display);
    startTimer(fiveMinutes, display);
    console.log(manche);
    ResetAll();
    scale = 0;
  }
});
