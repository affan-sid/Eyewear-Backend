const Joi = require('joi');
const mongoose = require('mongoose');

const shopSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    // img_file: {
    //     data: Buffer,
    //     contentType: String,
    // },
    location: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    wallet: {
        type: Number,
        required: true,
    }
});

const Shop = mongoose.model('Shop', shopSchema);

function shopValidate(shop) {
    const schema = Joi.object({
        name: Joi.string().required(),
        location: Joi.string().required(),
        email: Joi.string().required(),
        password: Joi.string().required(),
        role: Joi.string().required(),
    });
    return schema.validate(shop);
}

exports.Shop = Shop;
exports.validateShop = shopValidate;
exports.shopSchema = shopSchema;
