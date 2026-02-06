const express = require('express');
const router = express.Router();
const challengeService = require('../services/challengeService');
const jwt = require('jsonwebtoken');

// Middleware
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

router.use(authenticateToken);

router.post('/', async (req, res) => {
    try {
        const { title, goal, plan } = req.body;
        const result = await challengeService.createChallenge(req.user.userId, title, goal, plan);
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const { isComplete } = req.query;
        const result = await challengeService.listChallenges(req.user.userId, isComplete);
        res.json(result); // Already wrapped in { challenges: [] }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await challengeService.getChallenge(req.user.userId, req.params.id);
        res.json(result);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

router.post('/:id/proof', async (req, res) => {
    try {
        const { dayIndex, imageBase64 } = req.body;
        const result = await challengeService.uploadProof(req.user.userId, req.params.id, dayIndex, imageBase64);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/:id/reset', async (req, res) => {
    try {
        const result = await challengeService.resetChallenge(req.user.userId, req.params.id);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/:id/complete', async (req, res) => {
    try {
        const result = await challengeService.completeChallenge(req.user.userId, req.params.id);
        res.json(result); // Response not strictly defined in plan, but returning status is good.
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
