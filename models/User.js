const mongoose = require('mongoose')
const Schema = mongoose.Schema


const Usuario = new Schema({
    username: String,
    password: String
})

mongoose.model("users", Usuario)
