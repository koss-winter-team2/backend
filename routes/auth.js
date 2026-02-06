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

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication APIs
 */

/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nickname
 *               - email
 *               - pw
 *             properties:
 *               nickname:
 *                 type: string
 *               email:
 *                 type: string
 *               pw:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing fields or error
 */
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

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - pw
 *             properties:
 *               email:
 *                 type: string
 *               pw:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jwttoken:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
    try {
        const { email, pw } = req.body;
        const result = await authService.login(email, pw);
        res.json(result);
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/v1/auth/users:
 *   get:
 *     summary: Get current user info
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/users', authenticateToken, async (req, res) => {
    try {
        const user = await authService.getUser(req.user.userId);
        res.json(user);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/v1/auth/nickname:
 *   post:
 *     summary: Change nickname
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nickname updated
 */
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
