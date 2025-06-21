// server.js

const express = require('express');
const app = express();
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('node:path');
const bodyParser = require('body-parser');
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const webPush = require('web-push');

mongoose.connect(process.env.MONGODB_URI);

const Usuario = mongoose.Schema({ username: String, password: String });
const Users = mongoose.model("users", Usuario);
const Messages = mongoose.model('Messages', { sender: String, receiver: String, message: String, date: String });
const Subscription = mongoose.model('subscriptions', { username: String, subscription: Object });

webPush.setVapidDetails(
  'fabriciodev28@gmail.com',
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY
);

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => res.sendFile(path.join(__dirname, './public/html/index.html')));
app.get('/cadastro.html', (req, res) => res.sendFile(path.join(__dirname, './public/html/cadastro.html')));
app.get('/chat.html', (req, res) => res.sendFile(path.join(__dirname, './public/html/chat.html')));

app.post('/chat.html', async (req, res) => {
    let key = 0;
    let users = await Users.find().exec();
    users.forEach(element => {
        if (req.body.username == element.username && req.body.password == element.password) {
            key = 1;
            res.sendFile(path.join(__dirname, './public/html/chat.html'));
        }
    });
    if (key == 0) res.redirect('/?login=0');
    username = req.body.username;
});

app.post('/cadastro.html', async (req, res) => {
    let key = 0;
    let users = await Users.find().exec();
    users.forEach(element => {
        if (req.body.username == element.username) key = 1;
    });
    if (key == 0) {
        new Users({ username: req.body.username, password: req.body.password }).save();
        username = req.body.username;
        res.sendFile(path.join(__dirname, './public/html/chat.html'));
    } else res.redirect('/cadastro.html?reg=0');
});

app.post('/subscribe', async (req, res) => {
    const { username, subscription } = req.body;
    await Subscription.findOneAndUpdate(
        { username },
        { subscription },
        { upsert: true }
    );
    res.status(201).json({});
});

let users = [];
io.on('connection', (socket) => {
    users.push({ name: username, id: socket.id, status: 1 });
    io.to(socket.id).emit('name', username);
    io.emit('user', users);

    socket.on('send_message', (data) => {
        let socketId = '';
        users.forEach((element) => {
            if (element.name == data.receiver) socketId = element.id;
        });
        const message = new Messages(data);
        message.save();
        io.to(socketId).emit('new_message', data);

        if (!socketId) {
            Subscription.findOne({ username: data.receiver }).then(sub => {
                if (sub) {
                    const payload = JSON.stringify({
                        title: `Nova mensagem de ${data.sender}`,
                        body: data.message,
                        url: '/chat.html'
                    });
                    webPush.sendNotification(sub.subscription, payload).catch(err => console.error(err));
                }
            });
        }
    });

    socket.on('chat_on', async (data) => {
        let query = await Messages.find().exec();
        let historico = [];
        query.forEach((obj) => {
            if (obj.sender == data.sender1 && obj.receiver == data.receiver1 ||
                obj.sender == data.sender2 && obj.receiver == data.receiver2) {
                historico.push(obj);
            }
        });
        let socketId = '';
        users.forEach((element) => {
            if (element.name == data.sender1) socketId = element.id;
        });
        io.to(socketId).emit('messages_hist', historico);
    });

    socket.on('disconnect', () => {
        let userOff = '';
        users.forEach((element) => {
            if (element.id === socket.id) {
                let index = users.indexOf(element);
                users[index].status = 0;
                userOff = element.name;
            }
            if (element.status == 0) {
                let index = users.indexOf(element);
                users.splice(index, 1);
            }
        });
        io.emit('off', userOff);
    });
});

http.listen(3000);
