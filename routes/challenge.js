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

/**
 * @swagger
 * tags:
 *   name: Challenges
 *   description: Challenge management APIs
 */

/**
 * @swagger
 * /api/v1/challenges:
 *   post:
 *     summary: Create a new challenge
 *     tags: [Challenges]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - plan
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               plan:
 *                 type: string
 *     responses:
 *       201:
 *         description: Challenge created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Challenge'
 *   get:
 *     summary: List challenges
 *     tags: [Challenges]
 *     parameters:
 *       - in: query
 *         name: isComplete
 *         schema:
 *           type: boolean
 *         description: Filter by completion status
 *     responses:
 *       200:
 *         description: List of challenges
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 challenges:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Challenge'
 */
router.post('/', async (req, res) => {
    try {
        const { title, category, plan } = req.body;
        const result = await challengeService.createChallenge(req.user.userId, title, category, plan);
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

/**
 * @swagger
 * /api/v1/challenges/{id}:
 *   get:
 *     summary: Get challenge details
 *     tags: [Challenges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Challenge details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Challenge'
 *       404:
 *         description: Challenge not found
 */
router.get('/:id', async (req, res) => {
    try {
        const result = await challengeService.getChallenge(req.user.userId, req.params.id);
        res.json(result);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/v1/challenges/{id}/proof:
 *   post:
 *     summary: Upload proof for a challenge day
 *     tags: [Challenges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dayIndex
 *               - imageBase64
 *             properties:
 *               dayIndex:
 *                 type: integer
 *               imageBase64:
 *                 type: string
 *     responses:
 *       200:
 *         description: Proof uploaded
 */
router.post('/:id/proof', async (req, res) => {
    try {
        const { dayIndex, imageBase64 } = req.body;
        const result = await challengeService.uploadProof(req.user.userId, req.params.id, dayIndex, imageBase64);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/v1/challenges/{id}/reset:
 *   post:
 *     summary: Reset challenge progress
 *     tags: [Challenges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Challenge reset
 */
router.post('/:id/reset', async (req, res) => {
    try {
        const result = await challengeService.resetChallenge(req.user.userId, req.params.id);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/v1/challenges/{id}/complete:
 *   post:
 *     summary: Mark challenge as complete
 *     tags: [Challenges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Challenge completed
 */
router.post('/:id/complete', async (req, res) => {

    try {
        const result = await challengeService.completeChallenge(req.user.userId, req.params.id);
        res.json(result); // Response not strictly defined in plan, but returning status is good.
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/v1/challenges/{id}/proof/{dayIndex}:
 *   get:
 *     summary: Get uploaded proof photo for a specific day
 *     tags: [Challenges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Challenge ID
 *       - in: path
 *         name: dayIndex
 *         required: true
 *         schema:
 *           type: integer
 *         description: Day index (0, 1, or 2)
 *     responses:
 *       200:
 *         description: Proof photo retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dayIndex:
 *                   type: integer
 *                 imageBase64:
 *                   type: string
 *                 uploadedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Proof not found
 */
router.get('/:id/proof/:dayIndex', async (req, res) => {
    try {
        const result = await challengeService.getProof(req.user.userId, req.params.id, req.params.dayIndex);
        res.json(result);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/v1/challenges/{id}:
 *   delete:
 *     summary: Delete a challenge
 *     tags: [Challenges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Challenge ID
 *     responses:
 *       200:
 *         description: Challenge deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Challenge not found
 */
router.delete('/:id', async (req, res) => {
    try {
        const result = await challengeService.deleteChallenge(req.user.userId, req.params.id);
        res.json(result);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

module.exports = router;
