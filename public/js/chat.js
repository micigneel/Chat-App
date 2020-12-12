const socket = io();

//Elements
const $messageForm = document.querySelector('form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

const $location = document.querySelector('#send-location');

//Options
const { username, room } = Qs.parse(location.search, {
                            ignoreQueryPrefix : true
                        });

const autoScroll = ()=>{
    //New Message Element
    const $newMessage = $messages.lastElementChild;

    //Height of the new Message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    //Visible Height
    const visibleHeight = $messages.offsetHeight;

    //Height of messages container
    const contHeight = $messages.scrollHeight;

    //how far have we scrolled
    //Offset from the top to the scrolled position
    const scrollOffset = $messages.scrollTop + visibleHeight + newMessageHeight; 

    console.log((contHeight - newMessageHeight), scrollOffset);
    if((contHeight - newMessageHeight) <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}
 
socket.on('locationMessage', (location)=>{
    console.log(location);
    const html = Mustache.render(locationTemplate,{
        username : location.username,
        url  : location.text,
        createdAt : moment(location.createdAt).format('h:mm a') 
    });
    $messages.insertAdjacentHTML('beforeend', html);
})

socket.on('message', (message)=>{
    console.log(message);
    const html = Mustache.render(messageTemplate,{
        username : message.username,
        message : message.text,
        createdAt : moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
})

socket.on('roomData', ({ room , users})=>{
    const html = Mustache.render(sidebarTemplate, {
            room, 
            users
    });
    $sidebar.innerHTML = html;
});

$messageForm.addEventListener('submit', (e)=>{
        e.preventDefault();
        $messageFormButton.setAttribute('disabled', 'disabled');
        const message = e.target.elements.message.value;
        socket.emit('userMessage', message, (error)=>{

            $messageFormButton.removeAttribute('disabled');
            $messageFormInput.value = '';
            $messageFormInput.focus();

            if(error)
                return console.log(error);
            console.log('Message was sent');
        });
})

$location.addEventListener('click', (e)=>{
       
        if(!navigator.geolocation){
            return alert('Geolocation is not supported by our browser')
        }
        $location.setAttribute('disabled', 'disabled');
        navigator.geolocation.getCurrentPosition((position)=>{
            socket.emit('send-location', {
                lat : position.coords.latitude,
                long : position.coords.longitude
            }, ()=>{
                $location.removeAttribute('disabled');
                console.log('Location Shared');
            })
        })
})

socket.emit('join' , { username,  room}, (error)=>{
        if(error){
            alert(error);
            location.href = '/'
        }
})
