const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const { Shop, validateShop } = require('../models/shop');
const { shopProd, shopProdValidate } = require('../models/shopProd');
const jwt = require('jsonwebtoken');
const config = require('config');

router.get('/:id', async (req, res, next) => {
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
        if (String(user.role) != "shop" && String(user.role) != "customer") {
            return res.status(400).json({ message: "user is not priveleged" });
        }
    });
    try {
        const shopProdd = await shopProd.find({ 'shop._id': req.params.id });
        if (!shopProdd) { return res.status(404).json({ message: "shops not found" }) }
        return res.status(200).json({ shopProd: shopProdd });
    }
    catch (err) {
        return new Error(err);
    }
});

router.post('/', async (req, res) => {
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
        if (String(user.role) != "shop") {
            return res.status(400).json({ message: "user is not priveleged" });
        }
    });

    const { error } = shopProdValidate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const shop = await Shop.findById(req.body.shop_id);
    if (!shop) return res.status(404).send('Shop not found');

    const shopProdd = new shopProd({
        shop: {
            _id: shop._id,
            name: shop.name,
            location: shop.location,
            email: shop.email,
            password: shop.password,
            role: shop.role
        },
        prod_name: req.body.product_name,
        quan: req.body.quan,
        unit_price: req.body.unit_price,
    });
    try {
        await shopProdd.save();
        res.status(200).json({ shopProd: shopProdd, message: "successful" });
    }
    catch (ex) {
        res.status(500).send(ex.message);
    }
});

router.put('/:name', async (req, res) => {
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
        if (String(user.role) != "shop") {
            return res.status(400).json({ message: "user is not priveleged" });
        }
    });

    try {
        const prod = await shopProd.find({ prod_name: req.params.name });
        if (!prod) {
            return res.status(404).json({ message: 'product not found' });
        }
        const result = await shopProd.findOneAndUpdate({ prod_name: req.params.name }, {
            prod_name: req.body.prod_name,
            quan: req.body.quan,
            unit_price: req.body.unit_price,
        }, { new: true });
        return res.status(200).json({ prod: result, message: 'product updated!' });
    } catch (ex) {
        return res.json(ex.message);
    }

})

router.delete('/:name', async (req, res) => {
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
        if (String(user.role) != "shop") {
            return res.status(400).json({ message: "user is not priveleged" });
        }
    });

    try {
        const prod = await shopProd.find({ prod_name: req.params.name });
        if (!prod) {
            return res.status(404).json({ message: 'product not found' });
        }
        const result = await shopProd.findOneAndDelete({ prod_name: req.params.name });
        return res.status(200).json({ prod: result, message: 'prod deleted finally from store' });
    } catch (ex) {
        return res.json(ex.message);
    }
})


module.exports = router;
