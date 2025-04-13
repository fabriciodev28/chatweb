//require dos modules
const express = require('express')
const app = express()

const mongoose = require('mongoose')

require('./models/Messages')
const Messages = mongoose.model('messages')

const users_router = require('./routes/users')

const path = require('path')

const bodyParser = require('body-parser')

const ejs = require('ejs')



//-----> config requires <------

//mongoose
mongoose.connect("mongodb+srv://fabriciodev28:WZwa19lI9kxVtaW2@app-chat.eajld.mongodb.net/?retryWrites=true&w=majority&appName=App-Chat")

//path
app.use(express.static(path.join(__dirname,'public')))

//body-parser
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

//ejs views
app.set('view engine', 'html');
app.engine('html', ejs.renderFile);

//server http e socket
const server = require('http').createServer(app);
const io = require('socket.io')(server);


//variável global que recebe todo novo usuário
let username = ''



//routes

app.use('/users', users_router)

app.get('/', (req,res)=>{

    res.render("index.html")

})


//variável global que armazena os usuários online
let users = []


//io instance
io.on('connection', (socket)=>{

    users.push({
        name: username,
        id: socket.id,
        status: 1
    })

    console.log(users);
    
    //Informar ao usuario quem ele é
    io.to(socket.id).emit('name', username)

    //Enviar a todos os usuarios quem esta online no momento
    io.emit('user', users)


    //Evento de mensagens entre os usuarios
    socket.on('send_message', (data)=>{

        let socketId = ''
        
        //Percorrer o array de objetos para pegar o socket id
        users.forEach((element)=>{
            
            if(element.name == data.receiver){
                socketId = element.id
            }
        })

        //Armazenar mensagens no banco de dados

            const message = new Messages({
                sender: data.sender,
                receiver: data.receiver,
                message: data.message,
                date: data.date
            })

            message.save().then(()=>{
                console.log('Salvo em DB');
            })


        //Enviando a mensagem
        io.to(socketId).emit('new_message', data)
    })



    //Pegando o historico de mensagens no banco de dados
    
    socket.on('chat_on', async (data)=>{
        
        let query = await Messages.find().exec()

        let historico = []

        query.forEach((obj)=>{
            if(obj.sender == data.sender1 && obj.receiver == data.receiver1 || obj.sender == data.sender2 && obj.receiver == data.receiver2){
                historico.push(obj)
            }
        })

        let socketId = ''
        
        users.forEach((element)=>{
            
            if(element.name == data.sender1){
                socketId = element.id
            }
        })

        console.log(historico)
        io.to(socketId).emit('messages_hist', historico)
    
    })



    socket.on('disconnect', ()=>{

        let userOff = ''
        
        users.forEach((element) =>{

            if(element.id === socket.id){
                let index = users.indexOf(element)
                users[index].status = 0
                userOff = element.name
            }

            if(element.status == 0){
                let index = users.indexOf(element)
                users.splice(index, 1)
            }

        })

        io.emit('off', userOff)
    })

    
})


server.listen(3000);
