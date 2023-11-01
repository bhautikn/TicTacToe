const socket = io('https://'+window.location.hostname);
let isMyturn = false;
let gameDiv = document.getElementsByClassName('game-div');
let counter = 0;
let WhatMySymbol = '';
let userId = '';
let opponent = '';

if(localStorage.name === undefined){
    const input_name_box = document.querySelector('#name-input');
    input_name_box.style.display = 'flex';
    document.querySelector('#name-submit-btn').onclick= (e)=>{
        e.preventDefault();
        input_name_box.style.display = 'none';
        let temp_name = document.querySelector('#name-value').value;
        localStorage.setItem('name', temp_name);
        socket.emit('name', localStorage.name, userId);
    }
}
else{
    setTimeout(()=>{
        socket.emit('name', localStorage.name, userId);
    }, 2000)
}
socket.on('myId', (id)=>{ userId = id; })
socket.on('reload',()=>{ location.reload(); });

socket.on('whoistern', whoseTern => {
    isMyturn = whoseTern;
    if (isMyturn)
        document.getElementById('whoistern').innerHTML = "Your Turn";
    else
        document.getElementById('whoistern').innerHTML = "Other player Turn";
})
socket.on('chngeOnDiv', (symbol, divId) => { 
    gameDiv[divId].innerHTML = symbol;
})
socket.on('clearDiv', () => {
    for (const iterator of gameDiv) {
        iterator.innerHTML = '';
        iterator.style.color = 'black';
    }
})
socket.on('myopponent', (name)=>{
    console.log(name)
    opponent = name;
    document.querySelector('.myopponent').innerHTML = name;
})
socket.on('WhatMySymbol', symbol => {
    WhatMySymbol = symbol;
    document.querySelector('.symbol').innerHTML = WhatMySymbol;
})
socket.on('new_connect', (count)=>{
    document.querySelector('.connected').innerHTML = count;
})
socket.on('win', (who, arr) => {
    console.log(who);
    if(who == WhatMySymbol){
        document.getElementById('whoistern').innerHTML = 'You are Winner';
    }
    else if(who == 'tie'){
        document.getElementById('whoistern').innerHTML = 'tie';
    }
    else{
        document.getElementById('whoistern').innerHTML = opponent +' is Winner';
    }
    document.querySelector('.timer').style.display = 'flex';
    for (let i of arr) {
        gameDiv[i].style.color = 'red';
    }
    setTimeout(() => {
        for (const it of gameDiv) {
            it.innerHTML = "";
            it.style.color = "black";
        }
        clearInterval(id1);
        document.querySelector('.timer').style.display = 'none';
    }, 6000)
    let second = 4;
    let id1 = setInterval(() => {
        document.querySelector('.timer').innerHTML = 'Game restart in ' + second--;
    }, 1000)

})
socket.on('notice', (notice) => {
    document.getElementById('whoistern').innerHTML = notice;
})
for (let iterator = 0; iterator < gameDiv.length; iterator++) {
    gameDiv[iterator].addEventListener('click', (e) => {
        if (isMyturn && e.target.innerHTML === "") {
            e.target.innerHTML = WhatMySymbol;
            socket.emit('changeOnDiv', iterator, userId);
        }
    })
}