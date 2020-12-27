const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = socketio(server)
let port = process.env.PORT || process.env.VCAP_APP_PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')


//Make sure to run over HTTPS 

/*app.use((req, res) => {
    res.setHeader('Content-Type', 'application/json');
});*/

//helmet
const helmet = require('helmet');
//import helmet from 'helmet';
app.use(helmet());
/*app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'"],
            scriptSrc: ["'self'"],
            reportUri: '/report-violation',
            objectSrc: ["'self'"],
            upgradeInsecureRequests: true,
        },
    },
    referrerPolicy: { policy: 'same-origin' },
    featurePolicy: {},
})); */

app.use(express.static(publicDirectoryPath))

// Use X-XXS protection

const xXssProtection = require("x-xss-protection");
 
// Set "X-XSS-Protection: 0"
app.use(xXssProtection());
app.use((req, res, next) => {
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });



/*
app.enable('trust proxy');


app.use (function (req, res, next) {
  if (req.secure || process.env.BLUEMIX_REGION === undefined) {
    next();
  } else {
    console.log('redirecting to https');
    res.redirect('https://' + req.headers.host + req.url);
  }
});*/

// Allow static files in the /public directory to be served
app.use(express.static(__dirname + '/public'));

server.listen(port, () => {
    console.log(`Listening on port: ${server.address().port}!`)
})

// variable to maintain connected users
const connectedUsers = {}

// user methods
const {addUser, removeUser, getUser, getUsersInChat} = require('./utils/users')

// construct method/file properly
const { generateMessage } = require('./utils/messages')
const { generateFile } = require('./utils/file')
const { application } = require('express')

//methods while connected users
io.on('connection', (socket) => {
    console.log('a new user connected')
    
    // when a new user connects, add to list and let all connected users know he entered
    socket.on('newUser', (options) => {
        const user = addUser({ id: socket.id, ...options })

        if (user) {
            socket.emit('message', generateMessage('Admin','Welcome!'))
            socket.broadcast.emit('message', generateMessage('Admin',`${user.userName} has joined!`))
            io.emit('updateUsersList', {
                users: getUsersInChat()
            })

            connectedUsers[user.userName] = socket
        }
    })

    // send message to all connected users
    socket.on('sendMessage', (message) => {
        const user = getUser(socket.id)
        io.emit('message', generateMessage(user.userName, message))
    })

    // send a private message only to users selected
    socket.on('privateMessage', (message, to) => {
        // get sender and add him to reciever list
        const user = getUser(socket.id)
        const userName = user.userName
        to.push(userName)

        // loop over recieveres and send them a message
        to.map((friend) => {
            connectedUsers[friend].emit('message', generateMessage(userName, message))
        })
    })

    // send file to all connected users based on file type
    socket.on('sendFile', function (msg) {
        socket.username = msg.userName;

        //get file types and send to the correct method
        const fileType = msg.file.split("/")[0]
        if(fileType === "data:video"){
            io.emit('video', generateFile(msg.userName, msg.file))
        } else if(fileType === "data:image"){
        io.emit('image', generateFile(msg.userName, msg.file))
        } else if(fileType === "data:audio"){
            io.emit('audio', generateFile(msg.userName, msg.file))
        } else{
            console.log('ERROR, can not send this type of file');
        }
    });

    socket.on('privateFile', (fileToBeSent, to) => {
        // get sender and add him to reciever list
        const user = getUser(socket.id)
        const userName = user.userName
        to.push(userName)

        // get file type and then
        // loop over recieveres and send them the file
        const fileType = fileToBeSent.file.split("/")[0]

        if(fileType === "data:video"){
            to.map((friend) => {
                connectedUsers[friend].emit('video', generateFile(fileToBeSent.userName, fileToBeSent.file))
            })
        } else if(fileType === "data:image"){
            to.map((friend) => {
                connectedUsers[friend].emit('image', generateFile(fileToBeSent.userName, fileToBeSent.file))
            })
        } else if(fileType === "data:audio"){
            to.map((friend) => {
                connectedUsers[friend].emit('audio', generateFile(fileToBeSent.userName, fileToBeSent.file))
            })
        } else{
            console.log('ERROR, can not send this type of file');
        }
    })

    // when user disconnects, remove from list and tell other users that he left
    socket.on('disconnect', () => {
        const userToRemove = removeUser(socket.id)

        if (userToRemove) {
            io.emit('message', generateMessage('Admin', `${userToRemove.userName} has left the chat!`))
            io.emit('updateUsersList', {
                users: getUsersInChat()
            })
        }
    })
})







