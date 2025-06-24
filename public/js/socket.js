// public/main.js

const socket = io('https://chatweb-h5xi.onrender.com');

let sender = '';
let receiver = '';
let arrayUsers = [];

const messageInput = document.getElementById('message');
const form = document.getElementById('formMessages');




socket.on('name', (username) => {
    sender = username;

    // Service Worker e Push
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('Service Worker registrado com sucesso.');

            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    subscribeUser(registration);
                }
            });
        });
    }
});


function subscribeUser(registration) {
    const publicKey = 'BCd6N_MZ_4YFDDzLYLdAqzubtNpssVjDI_epE5gNCOfpbj2FJ7cHu0ph9_Znvu9SGNVNkbM3qxv9VOiG5YblyO4';
    registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
    }).then(subscription => {
        fetch('/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: sender, subscription })
        });
    });
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

socket.on('user', (users) => {
    arrayUsers = [];
    document.getElementById('user-list').innerHTML = '';
    users.forEach((element) => {
        if (element.name != sender && arrayUsers.indexOf(element.name) == -1 && element.name != '') {
            let html = `<div id="${element.name}"><li class="usersList" onclick="onUserSelected(this.innerText)">${element.name}</li><span id="status">Online</span></div>`;
            document.getElementById('user-list').innerHTML += html;
            arrayUsers.push(element.name);
        }
    });
});

function onUserSelected(username) {
    receiver = username;
    document.getElementById('chat_area').style.display = 'flex';
    document.getElementById('contato').innerHTML = username;

    let historico = {
        sender1: sender,
        receiver1: receiver,
        sender2: receiver,
        receiver2: sender
    };
    socket.emit('chat_on', historico);
    document.getElementById('messages').innerHTML = '';
}

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = new Date();
    let dia = data.getDate().toString().padStart(2, '0');
    let mes = (data.getMonth() + 1).toString().padStart(2, '0');
    let ano = data.getFullYear();
    let horas = data.getHours();
    let minutos = data.getMinutes();
    let string = `${dia}/${mes}/${ano} ${horas}:${minutos}`;

    let new_Message = messageInput.value.trim();
    if (new_Message) {
        socket.emit('send_message', { receiver, sender, message: new_Message, date: string });
        document.getElementById('messages').innerHTML += '<div class="messageMe">' + new_Message + '</div>';
        document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
        messageInput.value = '';
    }
});

socket.on('new_message', (data) => {
    if (Notification.permission === 'granted') {
        new Notification("Chat Web", {
            icon: './comment-regular.svg',
            body: data.sender + ': Nova Mensagem'
        }).onclick = () => onUserSelected(data.sender);
    }

    if (receiver == data.sender) {
        document.getElementById('messages').innerHTML += '<div class="message">' + data.message + '</div>';
        document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
    }
});

socket.on('messages_hist', (data) => {
    data.forEach((obj) => {
        let messages = document.getElementById('messages');
        if (obj.sender == sender) {
            messages.innerHTML += '<div class="messageMe">' + obj.message + '</div>';
        } else {
            messages.innerHTML += '<div class="message">' + obj.message + '</div>';
        }
    });
});

function showList() {
    if (document.getElementById('menu_toggle').checked) {
        document.getElementById('sidebar').style.display = 'flex';
        document.getElementById('chat_area').style.display = 'none';
    } else {
        document.getElementById('sidebar').style.display = 'none';
    }
}

function selectUser() {
    if (window.innerWidth < 769) {
        document.getElementById('sidebar').style.display = 'none';
        document.getElementById('menu_toggle').checked = false;
    }
}

socket.on('off', (userOff) => {
    let userInList = document.getElementById(userOff);
    if (userInList) {
        let statusSpan = userInList.querySelector('#status');
        if (statusSpan) {
            statusSpan.innerHTML = 'Offline';
            statusSpan.style.color = 'red';
        }
    }
});
