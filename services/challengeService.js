const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

const createChallenge = async (userId, title, goal, plan) => {
    const db = getDB();
    const newChallenge = {
        userId: new ObjectId(userId),
        title,
        goal,
        plan,
        days: [false, false, false],
        currentDay: 0,
        isComplete: false,
        proofs: [],
        createdAt: new Date()
    };

    const result = await db.collection('challenges').insertOne(newChallenge);
    return {
        challengeId: result.insertedId,
        goal,
        days: newChallenge.days,
        currentDay: newChallenge.currentDay
    };
};

const listChallenges = async (userId, isComplete) => {
    const db = getDB();
    const query = { userId: new ObjectId(userId) };
    if (isComplete !== undefined) {
        query.isComplete = isComplete === 'true'; // Query param is string
    }

    const challenges = await db.collection('challenges').find(query).toArray();
    return {
        challenges: challenges.map(c => ({
            challengeId: c._id,
            title: c.title,
            isComplete: c.isComplete,
            currentDay: c.currentDay,
            days: c.days
        }))
    };
};

const getChallenge = async (userId, challengeId) => {
    const db = getDB();
    const challenge = await db.collection('challenges').findOne({
        _id: new ObjectId(challengeId),
        userId: new ObjectId(userId)
    });

    if (!challenge) throw new Error('Challenge not found');

    return {
        challengeId: challenge._id,
        goal: challenge.goal,
        days: challenge.days,
        currentDay: challenge.currentDay
    };
};

const uploadProof = async (userId, challengeId, dayIndex, imageBase64) => {
    const db = getDB();
    const cid = new ObjectId(challengeId);

    const challenge = await db.collection('challenges').findOne({ _id: cid, userId: new ObjectId(userId) });
    if (!challenge) throw new Error('Challenge not found');

    if (dayIndex < 0 || dayIndex > 2) throw new Error('Invalid day index');

    // Update days array
    const newDays = [...challenge.days];
    newDays[dayIndex] = true;

    // Check if newly completed (simple check, or wait for complete endpoint?)
    // Logic: Proof just updates the day status.

    await db.collection('challenges').updateOne(
        { _id: cid },
        {
            $set: { days: newDays },
            $push: { proofs: { dayIndex, imageBase64, uploadedAt: new Date() } }
        }
    );

    return {
        days: newDays,
        isCompleted: challenge.isComplete // Status hasn't changed by proof alone unless logic demands it
    };
};

const resetChallenge = async (userId, challengeId) => {
    const db = getDB();
    const cid = new ObjectId(challengeId);

    await db.collection('challenges').updateOne(
        { _id: cid, userId: new ObjectId(userId) },
        {
            $set: {
                days: [false, false, false],
                currentDay: 0
                // resetCount removed as requested
            }
        }
    );

    return {
        days: [false, false, false]
    };
};

const completeChallenge = async (userId, challengeId) => {
    const db = getDB();
    const cid = new ObjectId(challengeId);

    await db.collection('challenges').updateOne(
        { _id: cid, userId: new ObjectId(userId) },
        { $set: { isComplete: true } }
    );

    return { isComplete: true };
};

module.exports = { createChallenge, listChallenges, getChallenge, uploadProof, resetChallenge, completeChallenge };
