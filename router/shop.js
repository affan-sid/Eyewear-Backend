const { Shop, validateShop } = require('../models/shop');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const config = require('config');
const { json } = require('express');
const { shopProd } = require('../models/shopProd');
const multer = require('multer')
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', async (req, res, next) => {
    const cookies = req.headers.cookie;
    if (!cookies) { return res.status(404).json({ message: "cookies not found" }) }

    const token = cookies.split("=")[1];
    if (!token) {
        return res.status(400).json({ message: "token not found!" });
    }

    jwt.verify(String(token), config.get("jwtPrivateKey"), (err, user) => {
        if (err) {
            return res.status(400).json({ message: "invalid token" });
        }
        if (String(user.role) != "admin" && String(user.role) != "customer") {
            return res.status(400).json({ message: "user is not priveleged" });
        }
    });
    try {
        const shops = await Shop.find();
        if (!shops) { return res.status(404).json({ message: "shops not found" }) }
        res.status(200).json({ shops });
    }
    catch (err) {
        return new Error(err);
    }
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
    let shop;
    try {
        shop = await Shop.findById(userId, "-password");
    } catch (err) {
        return new Error(err);
    }
    if (!shop) {
        return res.status(404).json({ messsage: "User not found" });
    }
    return res.status(200).json({ shop });
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
        if (String(user.role) != "shop") {
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

router.get('/:id', async (req, res, next) => {
    // const cookies = req.headers.cookie;
    // if (!cookies) { return res.status(404).json({ message: "cookies not found" }) }

    // const token = cookies.split("=")[1];
    // if (!token) {
    //     return res.status(400).json({ message: "token not found!" });
    // }

    // jwt.verify(String(token), config.get("jwtPrivateKey"), (err, user) => {
    //     if (err) {
    //         return res.status(400).json({ message: "invalid token" });
    //     }
    //     if (String(user.role) != "shop") {
    //         return res.status(400).json({ message: "user is not priveleged" });
    //     }
    // });
    try {
        console.log(req.params.id)
        const shop = await Shop.find({ _id: req.params.id });
        if (!shop) { return res.status(404).json({ message: "shop not found" }) }
        return res.status(200).json({ shop })
    }
    catch (err) {
        return new Error(err);
    }
});


router.post('/', upload.single('file'), async (req, res, next) => {
    const cookies = req.headers.cookie;
    if (!cookies) { return res.status(404).json({ message: "cookies not found" }) }

    const token = cookies.split("=")[1];
    if (!token) {
        return res.status(400).json({ message: "token not found!" });
    }

    jwt.verify(String(token), config.get("jwtPrivateKey"), (err, user) => {
        if (err) {
            return res.status(400).json({ message: "invalid token" });
        }
        if (String(user.role) != "admin") {
            return res.status(400).json({ message: "user is not priveleged" });
        }
    });
    const { error } = validateShop(req.body);
    if (error) {
        res.status(400).send(error.details[0].message);
    }
    const hashedPassword = bcrypt.hashSync(req.body.password);

    // let img_file = {
    //     data: req.file.buffer,
    //     contentType: req.file.mimetype
    // }

    const shop = new Shop({
        name: req.body.name,
        location: req.body.location,
        email: req.body.email,
        password: hashedPassword,
        wallet: 0,
        role: req.body.role,
        // img_file: img_file
    });
    try {
        await shop.save();
        res.status(200).json({ message: "shop created successfully" });
    }
    catch (err) {
        return new Error(err);
    }
});

router.put("/:id", async (req, res, next) => {
    const cookies = req.headers.cookie;
    if (!cookies) { return res.status(404).json({ message: "cookies not found" }) }

    const token = cookies.split("=")[1];
    if (!token) {
        return res.status(400).json({ message: "token not found!" });
    }

    jwt.verify(String(token), config.get("jwtPrivateKey"), (err, user) => {
        if (err) {
            return res.status(400).json({ message: "invalid token" });
        }
        if (String(user.role) != "admin") {
            return res.status(400).json({ message: "user is not priveleged" });
        }
    });
    const { error } = validateShop(req.body);
    if (error) {
        res.status(400).send(error.details[0].message);
    }
    try {
        const shop = await Shop.findById(req.params.id)
        if (!shop) {
            res.status(404).send({ message: 'shop not found!' });
        }
        const hashedPassword = bcrypt.hashSync(req.body.password);
        const result = await Shop.findByIdAndUpdate({ _id: req.params.id }, {
            name: req.body.name,
            location: req.body.location,
            email: req.body.email,
            password: hashedPassword,
            role: req.body.role
        }, { new: true });
        const result1 = await shopProd.updateMany({ 'shop._id': req.params.id }, {
            $set: {
                shop: {
                    _id: req.params.id,
                    name: req.body.name,
                    location: req.body.location,
                    email: req.body.email,
                    password: hashedPassword,
                    role: req.body.role
                }
            }
        });

        res.status(200).json({ message: 'shop updated successfuly!' })
    }
    catch (err) {
        console.log(err.message);
    }

});


router.delete("/", async (req, res, next) => {
    const cookies = req.headers.cookie;
    if (!cookies) { return res.status(404).json({ message: "cookies not found" }) }

    const token = cookies.split("=")[1];
    if (!token) {
        return res.status(400).json({ message: "token not found!" });
    }

    jwt.verify(String(token), config.get("jwtPrivateKey"), (err, user) => {
        if (err) {
            return res.status(400).json({ message: "invalid token" });
        }
        if (String(user.role) != "admin") {
            return res.status(400).json({ message: "user is not priveleged" });
        }
    });

    try {
        const shop = await Shop.findOneAndRemove({ email: req.body.email });
        if (shop) {
            const shopprod = await shopProd.deleteMany({ email: shop.email });
            if (shopprod) {
                res.status(200).json({ message: "Shop and its all records deleted successfully!" });
            }
            else {
                res.status(200).json({ message: 'shop-deleted!' });
            }
        }
        else {
            res.status(404).json({ message: "shop not found!" });
        }
    }
    catch (err) {
        console.log(err.message);
        return res.status(404).json({ message: "Shop cant be deleted!" });
    }

});

router.post('/sign-in', async (req, res, next) => {
    const { email, password } = req.body;
    let existingUser;
    try {
        existingUser = await Shop.findOne({ email: email });
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

    return res.status(200).json({ message: "successfully logged in", shop: existingUser });

});


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
        if (String(user.role) != "shop") {
            return res.status(400).json({ messsage: "bad request" });
        }
        res.clearCookie(`${user._id}`);
        req.cookies[`${user._id}`] = "";
        return res.status(200).json({ message: "Successfully Logged Out" });
    });
});

module.exports = router;