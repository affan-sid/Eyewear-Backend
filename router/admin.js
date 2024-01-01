const { Admin, validateAdmin } = require('../models/admin');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const config = require('config');

router.post('/sign-up', async (req, res) => {
    const { error } = validateAdmin(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    let admin;
    try {
        admin = await Admin.findOne({ email: req.body.email });
    } catch (err) {
        return new Error(err);
    }
    if (admin) return res.status(400).send('Already registered user!');

    const hashedPassword = bcrypt.hashSync(req.body.password);
    const user = new Admin({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        role: req.body.role
    });
    await user.save();
    res.status(201).json({ message: "registered successfully" });
});

router.post('/sign-in', async (req, res, next) => {
    const { email, password } = req.body;
    let existingUser;
    try {
        existingUser = await Admin.findOne({ email: email });
    } catch (err) {
        return new Error(err);
    }

    if (!existingUser) {
        return res.status(400).json({ message: "user dont exist" });
    }
    const isPasswordCorrect = bcrypt.compareSync(password, existingUser.password);

    if (!isPasswordCorrect) {
        return res.status(400).json({ message: "invalid email/password" });
    }
    const token = jwt.sign({ _id: existingUser._id, role: existingUser.role }, config.get('jwtPrivateKey'), {
        expiresIn: "1h"
    });

    console.log("Generated Token\n", token);

    if (req.cookies[`${existingUser._id}`]) {
        req.cookies[`${existingUser._id}`] = "";
    }

    res.cookie(String(existingUser._id), token, {
        path: "/",
        expires: new Date(Date.now() + 1000 * 3600),
        httpOnly: true,
        sameSite: "lax"

    });

    return res.status(200).json({ message: "successfully logged in", admin: existingUser });

});
const verifyToken = (req, res, next) => {
    const cookies = req.headers.cookie;

    const token = cookies.split("=")[1];

    if (!token) {
        res.status(404).json({ message: "no token found" });
    }

    jwt.verify(String(token), config.get('jwtPrivateKey'), (err, user) => {
        if (err) {
            return res.status(400).json({ message: "invalid token" });
        }

        req.id = user._id;
        req.role = user.role;
    });
    next();
}

const getUser = async (req, res, next) => {
    const userId = req.id;
    let admin;
    try {
        admin = await Admin.findById(userId, "-password");
    } catch (err) {
        return new Error(err);
    }
    if (!admin) {
        return res.status(404).json({ messsage: "User not found" });
    }
    return res.status(200).json({ admin });
}

router.get('/refreshToken', (req, res, next) => {

    const cookies = req.headers.cookie;

    if (!cookies) {
        console.log("cookies not found user must not be logged in!");
        return res.status(404);
    }

    const prevToken = cookies.split("=")[1];
    if (!prevToken) {
        return res.status(400).json({ message: "Couldn't find token" });
    }

    jwt.verify(String(prevToken), config.get('jwtPrivateKey'), (err, user) => {
        if (err) {
            console.log(err);
            return res.status(403).json({ message: "Authentication failed" });
        }
        if (String(user.role) != "admin") {
            return res.status(400).json({ message: "this is not valid admin" });
        }

        res.clearCookie(`${user._id}`);
        req.cookies[`${user._id}`] = "";

        const token = jwt.sign({ _id: user._id, role: user.role }, config.get('jwtPrivateKey'), {
            expiresIn: "1h",
        });
        console.log("Regenerated Token\n", token);

        res.cookie(String(user._id), token, {
            path: "/",
            expires: new Date(Date.now() + 1000 * 3600),
            httpOnly: true,
            sameSite: "lax",
        });

        next();
    });
}, verifyToken, getUser);

router.post('/logout', verifyToken, (req, res, next) => {
    const cookies = req.headers.cookie;

    const prevToken = cookies.split("=")[1];
    if (!prevToken) {
        return res.status(400).json({ message: "Couldn't find token" });
    }

    jwt.verify(String(prevToken), config.get('jwtPrivateKey'), (err, user) => {
        if (err) {
            console.log(err);
            return res.status(403).json({ message: "Authentication failed" });
        }
        if (String(user.role) != "admin") {
            return res.status(400).json({ messsage: "bad request" });
        }
        res.clearCookie(`${user._id}`);
        req.cookies[`${user._id}`] = "";
        return res.status(200).json({ message: "Successfully Logged Out" });
    });
});

module.exports = router;