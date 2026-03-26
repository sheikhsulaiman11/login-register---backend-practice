import express from 'express';
import mongoose from 'mongoose';
import Model from './model/model.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import session from 'express-session';
import isAuth from './middleware/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log(process.env.MONGO_URL);

mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));



app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.get('/test', (req, res) => {
  res.send('Working');
});

app.get('/', (req, res) => {
    res.render('index', {
        pageTitle: 'Statefull Auth',
        activeForm: req.query.form === 'register' ? 'register' : 'login',
        message: req.query.message || null,
        error: req.query.error || null
    });
});

app.get('/dashboard', isAuth, async (req, res) => {
    const user = await Model.findById(req.session.userId).lean();

    if (!user) {
        req.session.destroy(() => {
            res.redirect('/?error=Session expired. Please log in again.');
        });
        return;
    }

    res.render('dashboard', {
        pageTitle: 'Dashboard',
        user
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/?message=Logged out successfully.');
    });
});

// user registration
app.post('/register', async (req, res) => {
    const {email, password} = req.body;

    const existingUser = await Model.findOne({ email });
    if (existingUser) {
        return res.redirect('/?form=register&error=Account already exists for that email.');
    }

    const hashed = await bcrypt.hash(password, 10);

    await Model.create({email, password: hashed});
    res.redirect('/?message=User registered successfully. Please log in.');
});


// user login
app.post('/login', async (req, res) => {
    const {email, password} = req.body;

    const user = await Model.findOne({email});
    if (!user) return res.redirect('/?error=User not found');
    
    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.redirect('/?error=Invalid password');

    req.session.userId = user._id;
    res.redirect('/dashboard');
});


app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
