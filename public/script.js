const socket = io('https://' + window.location.hostname);
let isMyturn = false;
let gameDiv = document.getElementsByClassName('game-div');
let counter = 0;
let WhatMySymbol = '';

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

socket.on('WhatMySymbol', symbol => {
    WhatMySymbol = symbol;
    document.querySelector('.symbol').innerHTML = WhatMySymbol;
})

socket.on('win', (who, arr) => {
    document.getElementById('whoistern').innerHTML = who;
    for (let i of arr) {
        gameDiv[i].style.color = 'red';
    }
    setTimeout(() => {
        for (const it of gameDiv) {
            it.innerHTML = "";
            it.style.color = "black";
        }
        clearInterval(id1);
        document.querySelector('h3').innerHTML = "";
    }, 6000)
    let second = 4;
    let id1 = setInterval(() => {
        document.querySelector('h3').innerHTML = 'Game restart in ' + second--;
    }, 1000)

})
socket.on('notice', (notice) => {
    document.getElementById('whoistern').innerHTML = notice;
})
for (let iterator = 0; iterator < gameDiv.length; iterator++) {
    gameDiv[iterator].addEventListener('click', (e) => {
        if (isMyturn && e.target.innerHTML === "") {
            e.target.innerHTML = WhatMySymbol;
            socket.emit('changeOnDiv', iterator);
        }
    })
}
