import express from 'express';
import mongoose from 'mongoose';
import Model from './model/model.js';
import bcrypt from 'bcrypt';
import auth from './middleware/auth.js';
import dotenv from 'dotenv';
import session from 'express-session';
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log(process.env.MONGO_URL);

mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));



app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}));

app.get('/test', (req, res) => {
  res.send('Working');
});

//user registration
app.post('/register', async (req, res) => {
    const {email, password} = req.body;

    const hashed = await bcrypt.hash(password, 10);

    await Model.create({email, password: hashed});
      res.send("User registered successfully");
   
})


//user login
app.post('/login', async (req, res) => {
    const {email, password} = req.body;

    const user = await Model.findOne({email});
    if (!user) return res.status(400).send('user not found');
    
    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.status(400) .send ('invalid password');

    req.session.userId = user._id;
    res.send("Login successful");
});

app.get('/dashboard', auth, (req, res) => {
    res.send('Welcome to the dashboard');
})

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});