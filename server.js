const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');
const Expense = require('./models/Expense');

const app = express();
app.use(cors());
app.use(express.json());

// 1. SERVE STATIC FILES: This tells Render to show your HTML/CSS/JS
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch((err) => console.error("❌ MongoDB Error:", err));

// --- API ROUTES ---
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ username, email, password });
        await newUser.save();
        res.status(201).json({ message: "Success" });
    } catch (err) { res.status(400).json({ error: "User exists" }); }
});

app.post('/api/auth/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email, password: req.body.password });
    if (user) res.json({ userId: user._id, username: user.username });
    else res.status(401).json({ error: "Invalid login" });
});

app.post('/api/expenses', async (req, res) => {
    const newExpense = new Expense({ user: req.body.userId, description: req.body.description, amount: req.body.amount });
    await newExpense.save();
    res.status(201).json(newExpense);
});

app.get('/api/expenses/:userId', async (req, res) => {
    const expenses = await Expense.find({ user: req.params.userId }).sort({ date: -1 });
    res.json(expenses);
});

app.delete('/api/expenses/:id', async (req, res) => {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

// 2. CATCH-ALL ROUTE: This ensures that refreshing the page doesn't break the app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

// 3. DYNAMIC PORT: Render will provide a port via process.env.PORT
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
