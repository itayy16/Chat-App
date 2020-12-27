const socket = io()

// Message elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messages = document.querySelector('#messages')
// File elements
const $fileForm = document.querySelector('#file-form')
const $fileFormInput = $fileForm.querySelector('input')
const $file = document.querySelector('#files')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
const videoTemplate = document.querySelector('#video-template').innerHTML
const imageTemplate = document.querySelector('#image-template').innerHTML
const audioTemplate = document.querySelector('#audio-template').innerHTML

// Options
const { userName } = Qs.parse(location.search, {ignoreQueryPrefix: true})
const to = [];

//maintains list of users for messages (private/multi)
function toggleUsersToPrivateMessage(event) {
    const username = event.innerHTML;
    if (to.includes(username)) {
        event.style.backgroundColor = '#7C5CBF' // default color
        to.splice(username)
    } else {
        event.style.backgroundColor = '#90EE90' // light green
        to.push(username)
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        userName: message.userName,
        message: message.text,
        createdAt: moment(message.createdAt).format('HH:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('video', (file) => {
    const html = Mustache.render(videoTemplate, {
        userName: file.userName,
        message: file.fileToBeUploaded,
        createdAt: moment(file.createdAt).format('HH:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('image', (file) => {
    const html = Mustache.render(imageTemplate, {
        userName: file.userName,
        message: file.fileToBeUploaded,
        createdAt: moment(file.createdAt).format('HH:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('audio', (file) => {
    const html = Mustache.render(audioTemplate, {
        userName: file.userName,
        message: file.fileToBeUploaded,
        createdAt: moment(file.createdAt).format('HH:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})


socket.on('updateUsersList', ({users}) => {
    const userListTemplate = Mustache.render(sidebarTemplate, {users})
    document.querySelector('#sidebar').innerHTML = userListTemplate
})

//event listener to the submit message button
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    
    const message = e.target.elements.message.value

    if (to.length == 0) {
        socket.emit('sendMessage', message)
    } else {
        socket.emit('privateMessage', message, to)
    }

    $messageFormInput.value = ''
    $messageFormInput.focus()

})

//event listener to the upload file button
$fileForm.addEventListener('submit', (e) => {
    e.preventDefault()

    var data = e.target.elements.file.files[0];
    readThenSendFile(data); 

    $fileFormInput.value = ''
    $fileFormInput.focus()

})

//helper function for sending the file
function readThenSendFile(data){

    var reader = new FileReader();
    reader.onload = function(evt){
        var msg ={};
        msg.userName = userName;
        msg.file = evt.target.result;
        msg.fileName = data.name;
        if (to.length == 0) {
            socket.emit('sendFile', msg);
        } else {
            socket.emit('privateFile', msg, to)
        }
        
    };
    reader.readAsDataURL(data);
}

//maintaining list of users
socket.emit('newUser', { userName })