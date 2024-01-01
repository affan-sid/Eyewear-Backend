const { Order, orderValidate } = require('../models/order');
const { Customer, customerValidate } = require('../models/customer');
const { Shop, validateShop } = require('../models/shop');
const { shopProd } = require('../models/shopProd');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const config = require('config');
const mongoose = require('mongoose');

router.post('/', async (req, res) => {
    const cart = req.body.cart
    if (cart === []) {
        return res.status(200).json({ message: 'cart empty...' })
    }
    var total_bill = 0

    cart.forEach((element) => {
        total_bill = total_bill + element.price;

    })

    if (total_bill == 0) {
        return res.status(200).json({ message: 'purchase anything...' })
    }
    const shop = await Shop.findOne({ _id: req.body.shop_id })
    if (!shop) {
        return res.status(400).json({ message: 'no shop found' })
    }

    const customer = await Customer.findOne({ _id: req.body.customer_id })
    if (!customer) {
        return res.status(400).json({ message: 'no customer found' })
    }
    if (total_bill > customer.wallet) {
        return res.status(200).json({ message: 'your wallet credit is low' })
    }

    const order = new Order({
        customer: {
            name: customer.name,
            address: req.body.address,
            cart: cart,
        },
        shop: {
            name: shop.name,
        },
        total_bill: total_bill
    })

    const products = {};
    for (const element of cart) {
        if (products[element.id]) {
            products[element.id] += 1;
        } else {
            products[element.id] = 1;
        }
    }

    const unique_products = []
    const unique_ids = []
    for (const id in products) {
        unique_products.push({ 'id': id, 'quan': products[id] })
        unique_ids.push(id)
    }

    const prod = await shopProd.find({
        '_id': {
            $in: unique_ids
        }
    })
    if (!prod) {
        return res.status(400).json({ message: 'prod not found' })
    }

    try {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            shop.wallet = shop.wallet + total_bill;
            customer.wallet = customer.wallet - total_bill;
            prod.forEach(element => {
                for (const p of unique_products) {
                    if (element.id == p.id) {
                        element.quan = element.quan - p.quan
                    }
                }
            })
            await order.save();
            await shop.save();
            await customer.save();
            for (const p of prod) {
                await p.save();
            }
            session.endSession();
        })
        return res.status(200).json({ message: 'order successful' })
    }
    catch (ex) {
        return res.status(500).json(ex);
    }

});

module.exports = router;