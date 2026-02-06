const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET || 'supersecret', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

router.post('/signup', async (req, res) => {
    try {
        const { nickname, email, pw } = req.body;
        if (!nickname || !email || !pw) return res.status(400).json({ error: 'Missing fields' });
        await authService.signup(nickname, email, pw);
        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, pw } = req.body;
        const result = await authService.login(email, pw);
        res.json(result);
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

router.get('/users', authenticateToken, async (req, res) => {
    try {
        const user = await authService.getUser(req.user.userId);
        res.json(user);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

router.post('/nickname', authenticateToken, async (req, res) => {
    try {
        const { nickname } = req.body;
        const result = await authService.updateNickname(req.user.userId, nickname);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
