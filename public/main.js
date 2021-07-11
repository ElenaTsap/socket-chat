//TODO: fix chat between 2 users
const socket = io();

const $ = selector => document.querySelector(selector);

const state = {
    currentUser: '',
    list: 'channels-list',
    users: [],
    channels: [],
    activeChat:'Home',
    usedChats: {Home:[]}
}

//managing the channels/users list
const listManager = (listItems, listType) => {
    $(`#${listType}`).innerHTML = '';
    listItems.forEach(item => {
        if (item!=state.currentUser) {
            $(`#${listType}`).insertAdjacentHTML('beforeend', `<li id="${item}" onclick="listClickHandler('${item}', '${listType}')" class ="list-item">${item}</li>`);
        }
        
        if (item == listItems[listItems.length-1] && state.list === 'channels-list') {
            listClickHandler(state.activeChat, 'channels-list');
        }
    });
}

const listClickHandler = (name, listType) => {
    if (listType == 'channels-list') {
        state.list = 'channels-list'
    } else {
        state.list = 'users-list'
    }
    
    $(`#${name}`).classList.remove('unread');

    const preItem = state.activeChat;
    state.activeChat = name;
    $(`#${preItem}`).classList.remove('active');
    $(`#${name}`).classList.add('active');
    
/*     if(!state.usedChats[name] && listType == 'users-list'){
        state.usedChats[name] = [];
    } */
    console.log('usedChats', state.usedChats)
    $('#chat-box').innerHTML = '';
    state.usedChats[state.activeChat].forEach( msg => {
        $('#chat-box').insertAdjacentHTML("beforeend", `<li>${msg}</li>`);
    });

    console.log('state', state);
}

//send the message
const clickHandler = () => {
    let msg = $('#msg-box');
    socket.emit('chat message', {list: state.list, from:state.currentUser, to:state.activeChat, msg:msg.value});
    msg.value = '';
}

socket.on('chat msg', envelope => {
//todo there is something wrong here --- envelope.chat and envelope.from....

//* find if the chat is in the used chats
    const chatFinder = () => {
        Object.keys(state.usedChats).forEach( key => {
            if(envelope.to == key) {
                state.usedChats[key].push(envelope.msg);
                if (state.activeChat != envelope.to) {
                    $(`#${envelope.from}`).classList.add('unread');
                }
                return 'found';
            }
        }
    )}

//* if it is not in the used chats put it
    if (chatFinder() != 'found') {
        state.usedChats[envelope.to] = [];
        state.usedChats[envelope.to].push(envelope.msg);
        if (state.activeChat != envelope.to) {
            $(`#${envelope.from}`).classList.add('unread');
        }
    }
    
    if (state.activeChat == envelope.to) {
        document.querySelector('#chat-box').insertAdjacentHTML("beforeend", `<li>${envelope.msg}</li>`);
    } 
});

socket.on('users', users => {
    state.users = users;
    listManager(users, 'users-list');
});

socket.on('channels', channels => {
    state.channels = channels;
    listManager(channels, 'channels-list');
});

socket.emit('token', sessionStorage.getItem('token'));

socket.on('ticket', ticket => {
    $('#chat-box')
    .insertAdjacentHTML("beforebegin", `<p class="chat-welcome slide-top">Today you are ${ticket.nickName}</p>`);
    state.currentUser = ticket.nickName;
    sessionStorage.setItem('token', ticket.token);
});