const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

const createChallenge = async (userId, title, category, plan) => {
    const db = getDB();
    const newChallenge = {
        userId: new ObjectId(userId),
        title,
        category,
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
        title,
        category,
        plan,
        days: newChallenge.days,
        currentDay: newChallenge.currentDay,
        isComplete: newChallenge.isComplete,
        createdAt: newChallenge.createdAt
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
            category: c.category,
            plan: c.plan,
            isComplete: c.isComplete,
            currentDay: c.currentDay,
            days: c.days,
            createdAt: c.createdAt
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
        title: challenge.title,
        category: challenge.category,
        plan: challenge.plan,
        days: challenge.days,
        currentDay: challenge.currentDay,
        isComplete: challenge.isComplete,
        createdAt: challenge.createdAt
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

const getProof = async (userId, challengeId, dayIndex) => {
    const db = getDB();
    const challenge = await db.collection('challenges').findOne({
        _id: new ObjectId(challengeId),
        userId: new ObjectId(userId)
    });

    if (!challenge) throw new Error('Challenge not found');

    const proof = challenge.proofs.find(p => p.dayIndex === parseInt(dayIndex));
    if (!proof) throw new Error('Proof not found for this day');

    return {
        dayIndex: proof.dayIndex,
        imageBase64: proof.imageBase64,
        uploadedAt: proof.uploadedAt
    };
};

const deleteChallenge = async (userId, challengeId) => {
    const db = getDB();
    const result = await db.collection('challenges').deleteOne({
        _id: new ObjectId(challengeId),
        userId: new ObjectId(userId)
    });

    if (result.deletedCount === 0) throw new Error('Challenge not found');

    return { message: 'Challenge deleted successfully' };
};

module.exports = { createChallenge, listChallenges, getChallenge, uploadProof, resetChallenge, completeChallenge, getProof, deleteChallenge };
