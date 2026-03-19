import mongoose from 'mongoose';

const modelSchema = new mongoose.Schema({
    email : {
        type: String,
        required: true,
    },
    password : {
        type: String,
        required: true,
    },
}) ;

const Model = mongoose.model('Model', modelSchema);

export default Model;