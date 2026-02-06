const { getDB } = require('../config/db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');

const SECRET_KEY = process.env.JWT_SECRET || 'supersecret';

// Helper for hashing (pbkdf2)
const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return { salt, hash };
};

const verifyPassword = (password, salt, originalHash) => {
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === originalHash;
};

const signup = async (nickname, email, pw) => {
    const db = getDB();
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
        throw new Error('Email already exists');
    }

    const { salt, hash } = hashPassword(pw);
    const newUser = {
        nickname,
        email,
        password: hash,
        salt, // Store salt!
        createdAt: new Date()
    };

    const result = await db.collection('users').insertOne(newUser);
    return { userId: result.insertedId, nickname, email };
};

const login = async (email, pw) => {
    const db = getDB();
    const user = await db.collection('users').findOne({ email });
    if (!user) {
        throw new Error('Invalid email or password');
    }

    if (!verifyPassword(pw, user.salt, user.password)) {
        throw new Error('Invalid email or password');
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, SECRET_KEY, { expiresIn: '1d' });
    return { jwttoken: token };
};

const getUser = async (userId) => {
    const db = getDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) throw new Error('User not found');
    return {
        email: user.email,
        nickname: user.nickname
    };
};

const updateNickname = async (userId, nickname) => {
    const db = getDB();
    await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { nickname } }
    );
    return { nickname };
};

module.exports = { signup, login, getUser, updateNickname };
