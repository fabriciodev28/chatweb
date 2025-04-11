const mongoose = require('mongoose')
const Schema = mongoose.Schema


const Messages = new Schema({
    sender: String,
    receiver: String,
    message: String,
    date: String
})

mongoose.model("messages", Messages)
