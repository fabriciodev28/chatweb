const express = require('express')
const router = express.Router()

//Mongoose
const mongoose = require('mongoose')
require('../models/User')
const Users = mongoose.model('users')



router.get('/cadastro.html', (req,res)=>{

    res.sendFile("public/html/cadastro.html")

})


router.get('/chat.html', (req,res)=>{

    res.sendFile("public/html/chat.html")

})


//Validacao de login
router.post('/chat.html', async (req,res)=>{

    let key = 0;
    
    let users = await Users.find().exec()

    users.forEach(element => {

        if(req.body.username == element.username && req.body.password == element.password){
            key = 1
            res.sendFile("public/html/chat.html")
        }

    });

    if(key == 0){
        
        res.redirect('/?login=0')

    }
    
    username = req.body.username

})

//Cadastro de usuários no banco de dados
router.post('/cadastro.html', async (req,res)=>{


    let key = 0;
    
    let users = await Users.find().exec()

    users.forEach(element => {

        if(req.body.username == element.username){
            key = 1
        }

    });

    if(key == 0){

        new Users({
            username: req.body.username,
            password: req.body.password
        }).save()

        username = req.body.username
        
        res.sendFile("public/html/chat.html")

    }else{
        res.redirect('/cadastro.html?reg=0')
    }


})

module.exports = router