const express = require('express');
const app = express();
//socket does not accept app as a server - it needs a bigger object.
//so we have to go outside of express and create a new bigger server
const http = require('http');
const server = http.createServer(app);
const port = process.env.PORT || 8081;
//creating the socket server
const { Server } = require('socket.io');
const io = new Server(server);
const jwt = require('jsonwebtoken');

app.use(express.static(__dirname + '/public'));

const usersMap = {};
const users = [];
const channels = ['Home', 'Park', 'Pool', 'Lake', 'Square'];
//for accessing index.html you do not have to specify in the url
// you can just write http://localhost:8080

io.on('connection', (socket) => {

    socket.emit('channels', channels);
    //when a user connects, we create a unique nickname and emit
    socket.on('token', token => {
        const ticketHandler = (nickName) => {
            if (!nickName) {
                nickName = 'Guest' + Date.now();
            } 
            const token = jwt.sign({nickName}, 'ahguy21367278@#$%$%@wer', {expiresIn: '1w'});
            const ticket = {token, nickName};
            console.log(nickName + ' joined the chat!');
            let findUser = users.find(user => user == nickName);
            !findUser ? users.push(nickName):'';
            usersMap[nickName] = socket;
            socket.userName = nickName;
            return ticket
        }

        if (token) {
            try {
                jwt.verify(token, 'ahguy21367278@#$%$%@wer', (fail, decodedPayload) => {
                    if (fail) {
                        //token is invalid here
                        socket.emit('ticket', ticketHandler());
                    } else {
                        //we can trust decoded payload here
                        socket.emit('ticket', ticketHandler(decodedPayload.nickName));
                    }
                });
            } catch (err) {
                console.log(err);
                //TODO: Manage error case on server and client
            }
        } else {
            socket.emit('ticket', ticketHandler());
        }
        io.emit('users', users);
    });

    socket.on('chat message', (envelope) => {
        console.log('envelope', envelope);
        if (envelope.list == 'users-list') {
            socket.emit('chat msg', envelope);
            usersMap[envelope.to].emit('chat msg', envelope);
        } else {
            io.emit('chat msg', envelope);
        }
    })

    socket.on('disconnect', () => {
        console.log('user disconnected', socket.userName);
        users.map ((user, index) => {
            if(socket.userName == user) {
                users.splice(index, 1)
                return
            } 
        })
        io.emit('users', users)
    })
});

//start listens to the node.js server - the bigger server
server.listen(port, () => console.log(`Server started on port ${port}`))