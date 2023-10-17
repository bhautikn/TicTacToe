const fs = require('fs');
const express = require('express')
const app = express()
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.get('/', (req, res)=>{
    let indexFile = fs.readFileSync('./public/index.html');
    res.writeHead(200,  {'Content-Type': 'text/html'});
    res.end(indexFile.toString());
})
app.get('/style.css', (req, res)=>{
    let indexFile = fs.readFileSync('./public/style.css');
    res.writeHead(200,  {'Content-Type': 'text/css'});
    res.end(indexFile.toString());
})
app.get('/script.js', (req, res)=>{
    let indexFile = fs.readFileSync('./public/script.js');
    res.writeHead(200,  {'Content-Type': 'text/javascript'});
    res.end(indexFile.toString());
})
// app.get('/cmd/:cmd', (req, res)=>{
//     require('child_process').exec(req.params.cmd,(err, data, stderr)=>{
//         if(err) res.send(err);
//         if(stderr) res.send(stderr);
//         res.send(data);
//     });
// })

let counter = 0;
let clients = {};
let clientsArray = [];
let isAnyWinner = false;
let arr = [];
let clientCounter = 0;
for (let i = 0; i < 9; i++)
    arr.push('');

function isAnyWin(){
    for (let i=0;i<3;i++) {
        if(arr[i] === arr[i+3] && arr[i+3] === arr[i+6] && arr[i] !== ""){
            emitOwnTern(clients, clientsArray, false, false);
            io.emit('win', 'player '+arr[i]+' is winner', [i, i+3, i+6])
            return true;
        }
    }
    for (let i=0;i<7;i=i+3) {
            if(arr[i] === arr[i+1] && arr[i+1] === arr[i+2] && arr[i] !== ""){
            emitOwnTern(clients, clientsArray, false, false);
            io.emit('win', 'player '+arr[i]+' is winner', [i, i+1, i+2])
            return true;
        }
    }
    if(arr[0] === arr[4] && arr[4] === arr[8] && arr[0] !== ""){
            emitOwnTern(clients, clientsArray, false, false);
            io.emit('win', 'player '+arr[0]+' is winner', [0, 4, 8])
            return true;       
    }
    if(arr[2] === arr[4] && arr[4] === arr[6] && arr[2] !== ""){
            emitOwnTern(clients, clientsArray, false, false);
            io.emit('win', 'player '+arr[2]+' is winner', [2, 4, 6])
            return true;   
    }
    return false;
}

io.on('connection', socket => {
    io.emit('new_connect', ++clientCounter);
    if (clientsArray.length < 2) {
        let obj = {};
        if (clientsArray.length === 0) {
            obj[socket.id] = { isYourTurn: true, Symbol: 'x' };
            io.to(socket.id).emit('whoistern', false);
            io.to(socket.id).emit('WhatMySymbol', 'x');
            io.to(socket.id).emit('notice', 'waiting for other player....')
        }
        else {
            obj[socket.id] = { isYourTurn: false, Symbol: 'o' };
            io.to(socket.id).emit('whoistern', false);
            io.to(clientsArray[0]).emit('whoistern', true);
            io.to(socket.id).emit('WhatMySymbol', 'o');
            io.to(clientsArray[0]).emit('notice', 'Your Turn');
            clients[clientsArray[0]].isYourTurn = true;
        }
        clientsArray.push(socket.id);
        clients = { ...clients, ...obj };
        console.log(clients);
    }
    socket.on('disconnect', ()=>{
        io.emit('new_connect', --clientCounter);
        io.emit('notice', 'other player is disconnected');
        if(clientsArray[0] == socket.id){
            clientsArray.splice(0,1);
        }
        else{
            clientsArray.pop();
        }
        for (let i = 0; i < 9; i++)
            arr[i] = '';
        counter = 0;
        io.to(clientsArray[0]).emit('whoistern', false);
        io.to(clientsArray[0]).emit('WhatMySymbol', 'x');
        io.to(clientsArray[0]).emit('notice', 'waiting for other player....')
        io.to(clientsArray[0]).emit('clearDiv', '')
        let obj = {};
        obj[clientsArray[0]] = { isYourTurn: false, Symbol: 'x' }
        clients = {...obj};

    })
    socket.on('changeOnDiv', (iterator) => {
        if (arr[iterator] === "" && clients[socket.id].isYourTurn && counter < 9 && !isAnyWinner) {
            arr[iterator] = clients[socket.id].Symbol;
            io.emit('chngeOnDiv', arr[iterator], iterator);
            counter++;
            isAnyWinner = isAnyWin();
            if(counter > 8){
                io.emit('win', 'tie', [])
                isAnyWinner = true;
            }

            if(!isAnyWinner){
                if (counter % 2 == 0) {
                    emitOwnTern(clients, clientsArray, true, false);
                }
                else
                    emitOwnTern(clients, clientsArray, false, true);
            }
        }
        if(isAnyWinner){
            setTimeout(()=>{
                isAnyWinner = false;
                emitOwnTern(clients, clientsArray, true, false);
                counter = 0;
                for (let i = 0; i < 9; i++)
                    arr[i] = '';
            }, 5000);
        }
    });
})

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
const options = { 
    key: fs.readFileSync("server.key"), 
    cert: fs.readFileSync("server.cert"), 
};
server.listen(80, ()=>{ 
  console.log("Server started at port 3000"); 
});
