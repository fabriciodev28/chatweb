const express = require('express')
const router = express.Router()

//Mongoose
const mongoose = require('mongoose')
require('../models/User')
const Users = mongoose.model('users')


//variável global que recebe todo novo usuário
let username = ''


router.get('/cadastro.html', (req,res)=>{

    res.render("cadastro.html")

})


router.get('/chat.html', (req,res)=>{

    res.render("chat.html")

})


//Validacao de login
router.post('/chat', async (req,res)=>{

    let key = 0;
    
    let users = await Users.find().exec()

    users.forEach(element => {

        if(req.body.username == element.username && req.body.password == element.password){
            key = 1
            res.render("chat.html")
        }

    });

    if(key == 0){
        
        res.redirect('/?login=0')

    }
    //console.log(req.body.username)
    username = req.body.username
    console.log(username)

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

        //username = req.body.username
        res.render("chat.html")

    }else{
        res.redirect('/cadastro.html?reg=0')
    }


})

console.log(username)
module.exports = [router, username]