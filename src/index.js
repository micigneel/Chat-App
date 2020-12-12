const path = require('path');
const http = require('http');
const express = require('express');
const app = express();
const socketio = require('socket.io');
const Filter = require('bad-words');
const {
        addUser,
        removeUser,
        getUser,
        getUsersInRoom
      } = require('../src/utils/users');

const { generateMessage } = require('../src/utils/messages');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket)=>{
    console.log('New Connection');

    socket.on('join', ({ username , room }, callback)=>{
        
        const { error , user} = addUser({ id : socket.id , username , room});
        if(error){
            return callback(error)
        }
        socket.join(user.room);
        socket.emit('message', generateMessage('Welcome', 'Admin'));
        socket.broadcast.to(user.room).emit('message', 
                                        generateMessage(`${user.username} has joined`))
        io.to(user.room).emit('roomData', {
                room : user.room,
                users : getUsersInRoom(user.room)
        });
        callback();
    })

    socket.on('userMessage', (message, callback)=>{
        const filter = new Filter();
        const user =  getUser(socket.id);
        if(user){
            if(filter.isProfane(message)){
                return callback('Profanity is not allowed')
            }
            io.to(user.room).emit('message', generateMessage(message, user.username));
            callback();
        }
    })

    socket.on('send-location', (location, callback)=>{
        const user =  getUser(socket.id);
        if(user){
            socket.broadcast.to(user.room).emit('locationMessage', 
            generateMessage('https://www.google.com/maps?q='+location.lat+','+location.long, user.username));
            callback();
        }
        
    })

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message', generateMessage(`A ${user.username} has left`));
            io.to(user.room).emit('roomData', {
                room : user.room,
                users : getUsersInRoom(user.room)
            });
        }
    })
})

app.use(express.static(path.join(__dirname, '../public')));

server.listen(PORT, ()=>{
    console.log('Server started at the server ', PORT);
})