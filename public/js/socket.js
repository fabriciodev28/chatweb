const socket = io('http://localhost:3000')

        let sender = ''
        let receiver = ''

        //Mensagem que o usuário digita
        let message = document.getElementById('message');
        let form = document.getElementById('formMessages')


        socket.on('name', (username)=>{
            sender = username
            
        })

        let arrayUsers = []

        //Mostrar usuários online
        socket.on('user', (users)=>{

            arrayUsers = []

            document.getElementById('user-list').innerHTML = ''
            
            users.forEach((element)=>{
                if(element.name != sender && arrayUsers.indexOf(element.name) == -1 && element.name != ''){
                    let html = `<div id="${element.name}"><li class="usersList" onclick="onUserSelected(this.innerText)">${element.name}</li><span id="status">Online</span></div>`
                    document.getElementById('user-list').innerHTML += html

                    arrayUsers.push(element.name)
                }
            })

            console.log(users)

        })



        //Função que recebe o destinatário da mensagem
        function onUserSelected(username){
            receiver = username

            document.getElementById('chat_area').style.display = 'flex'
            document.getElementById('contato').innerHTML = username         


            let historico = {
                sender1: sender,
                receiver1: receiver,
                sender2: receiver,
                receiver2: sender
            }

            socket.emit('chat_on', historico)

            document.getElementById('messages').innerHTML = ''

        }



        //Função que envia a mensagem para o servidor
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const data = new Date()

            let dia = data.getDate()
            let mes = data.getMonth() + 1
            let ano = data.getFullYear()
            let horas = data.getHours()
            let minutos = data.getMinutes()

            dia = dia < 10 ? dia.toString().padStart(2, '0') : dia
            mes = mes < 10 ? mes.toString().padStart(2, '0') : mes

            let string = `${dia}/${mes}/${ano} ${horas}:${minutos}`

            if (message.value) {
              socket.emit('send_message', 
              //Objeto com os dados de usuários e a mensagem
                {
                    receiver: receiver,
                    sender: sender,
                    message: message.value,
                    date: string
                }
              );

              let messages = document.getElementById('messages')

              messages.innerHTML += '<div class="messageMe">' + message.value + '</div>'

              message.value = '';

            }
        });


        //Socket que recebe novas mensagens e imprime no navegador
        socket.on('new_message', (data)=>{

            if(receiver == data.sender){
                document.getElementById('messages').innerHTML += '<div class="message">' + data.message + '</div>'
            }

        })


        //Histórico de conversas
        socket.on('messages_hist', (data)=>{ 

            let arrayHistorico = data
            //let receiver = data.receiver

            arrayHistorico.forEach((obj)=>{
                let messages = document.getElementById('messages')
                if(obj.sender == sender){
                    messages.innerHTML += '<div class="messageMe">' + obj.message + '</div>'
                }else{
                    messages.innerHTML += '<div class="message">' + obj.message + '</div>'
                }
            })
        })

        socket.on('off', (userOff)=>{

            let userInList = document.getElementById(userOff)
            let test = userInList.children[1]
            test.innerHTML = 'Offline'
            test.style.color = 'red'

        })