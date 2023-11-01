const express = require('express');
const app = express()
const server = require('http').createServer(app);
const io = require('socket.io')(server);

///////////////////  servering basic files  /////////////////////

app.get('/', (req, res)=>{
    res.sendFile(__dirname+'/public/index.html');
})
app.get('/style.css', (req, res)=>{
    res.sendFile(__dirname+'/public/style.css');
})
app.get('/script.js', (req, res)=>{
    res.sendFile(__dirname+'/public/script.js');
})
//////////////////////////////////////////////////////////////////
//////////////////////  declare variable  ////////////////////////

let clientsArray = [[0, 1]];
let clientCounter = 0;
let clients = {};
let CharArr = [[0]];
let counter = [0];
let isAnyWinner = [false];

//////////////////////////////////////////////////////////////////
//////////////////////  manage connection  ///////////////////////
io.on('connection', (socket)=>{

    addClient(clientsArray, CharArr, clients, socket.id);
    io.emit('new_connect', ++clientCounter);
    socket.on('name', (name, id)=>{
        if (name == null) name = '';
        let number = Buffer.from(id, 'base64').toString();
        clients[socket.id].name = name.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
        try{
            if(clientsArray[number].length == 2){
                    io.to(clientsArray[number][0]).emit('myopponent', clients[clientsArray[number][1]].name);
                    io.to(clientsArray[number][1]).emit('myopponent', clients[clientsArray[number][0]].name);
            }
        }catch(e){
            console.log(e)
        }
    })
    socket.on('changeOnDiv', (iterator, userId) => {
        let i = atob(userId);
        if (CharArr[i][iterator] === "" && clients[socket.id].isYourTurn && counter[i] < 9 && !isAnyWinner[i]) {
            CharArr[i][iterator] = clients[socket.id].Symbol;
            io.to(clientsArray[i][0]).emit('chngeOnDiv', CharArr[i][iterator], iterator);
            io.to(clientsArray[i][1]).emit('chngeOnDiv', CharArr[i][iterator], iterator);
            counter[i]++;
            isAnyWinner[i] = isAnyWin(CharArr[i], clientsArray[i]);

            if(!isAnyWinner[i]){
                if (counter[i] % 2 == 0) {
                    emitOwnTern(clients, clientsArray[i], true, false);
                }
                else{
                    emitOwnTern(clients, clientsArray[i], false, true);
                }
            }
        }
        if(isAnyWinner[i]){
            isAnyWinner[i] = false;
            setTimeout(()=>{
                emitOwnTern(clients, clientsArray[i], true, false);
                counter[i] = 0;
                for (let j = 0; j < 9; j++)
                    CharArr[i][j] = '';
            }, 5000);
        }
        else if(counter[i] > 8){
            io.emit('win', 'tie', [])
            isAnyWinner[i] = false;
            setTimeout(()=>{
                emitOwnTern(clients, clientsArray[i], true, false);
                counter[i] = 0;
                for (let j = 0; j < 9; j++)
                    CharArr[i][j] = '';
            }, 5000);
        }
    });
    
    socket.on('disconnect', ()=>{
        io.emit('new_connect', --clientCounter);
        for (const i in clientsArray){
            if(clientsArray[i].indexOf(socket.id) != -1){
                io.to(clientsArray[i][0]).emit('reload', true);
                io.to(clientsArray[i][1]).emit('reload', true);
                
                delete clients[clientsArray[i][0]];
                delete clients[clientsArray[i][1]];

                clientsArray.splice(i, 1);
                CharArr.splice(i, 1);
                isAnyWinner.splice(i, 1);
                counter.splice(i, 1);

                break;
            }
        }
    })
})

//////////////////////////////////////////////////////////////////
/////////////////////// basic function ///////////////////////////
function addClient(arr, CharacterArr, clientObj, id){
    let obj = {};
    let number = arr.length-1;
    
    if(arr[number].length == 2){
        arr.push([id]);
        obj[id] = { isYourTurn: true, Symbol: 'x' };
        io.to(id).emit('whoistern', false);
        io.to(id).emit('WhatMySymbol', 'x');
        io.to(id).emit('notice', 'waiting for other player....');
        io.to(id).emit('myId', Buffer.from((number+1)+'').toString('base64'));
        counter.push(0);
        CharacterArr.push([]);
        isAnyWinner.push(false);
        for(let i=0;i<9;i++){
            CharacterArr[number+1].push('');
        }
    }
    else{
        arr[number].push(id);
        obj[id] = { isYourTurn: false, Symbol: 'o' };
        io.to(id).emit('whoistern', false);
        io.to(arr[number][0]).emit('whoistern', true);
        io.to(id).emit('WhatMySymbol', 'o');
        io.to(arr[number][0]).emit('notice', 'Your Turn');
        io.to(id).emit('myId', Buffer.from(number+"").toString('base64'));
    }
    clients = { ...clients, ...obj };
    console.log(clients)
}
function isAnyWin(arr, clintArr){
    for (let i=0;i<3;i++) {
        if(arr[i] === arr[i+3] && arr[i+3] === arr[i+6] && arr[i] !== ""){
            emitOwnTern(clients, clintArr, false, false);
            io.emit('win', arr[i], [i, i+3, i+6])
            return true;
        }
    }
    for (let i=0;i<7;i=i+3) {
            if(arr[i] === arr[i+1] && arr[i+1] === arr[i+2] && arr[i] !== ""){
            emitOwnTern(clients, clintArr, false, false);
            io.emit('win', arr[i], [i, i+1, i+2])
            return true;
        }
    }
    if(arr[0] === arr[4] && arr[4] === arr[8] && arr[0] !== ""){
            emitOwnTern(clients, clintArr, false, false);
            io.emit('win', arr[0], [0, 4, 8])
            return true;       
    }
    if(arr[2] === arr[4] && arr[4] === arr[6] && arr[2] !== ""){
            emitOwnTern(clients, clintArr, false, false);
            io.emit('win', arr[2], [2, 4, 6])
            return true;   
    }
    return false;
}
function emitOwnTern(obj, arr, a, b) {
    try{
        obj[arr[0]].isYourTurn = a;
        obj[arr[1]].isYourTurn = b;
        io.to(arr[0]).emit('whoistern', a)
        io.to(arr[1]).emit('whoistern', b)
    }catch(e){
        console.log(e);
    }
}
//////////////////////////////////////////////////////////////////

server.listen(80, ()=>{ 
  console.log("Server started at port", 80); 
}); 
