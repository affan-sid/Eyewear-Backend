const Joi = require('joi');
const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    customer: {
        type: new mongoose.Schema({
            name: {
                type: String,
                required: true
            },
            address: {
                type: String,
                required: true
            },
            cart: {
                type: Array,
                required: true
            },
        }),
        required: true
    },
    shop: {
        type: new mongoose.Schema({
            name: {
                type: String,
                required: true
            },
        }),
        required: true
    },
    total_bill: {
        type: Number,
        required: true,
    }
});

const Order = mongoose.model('Order', orderSchema);

function orderValidate(order) {
    const schema = Joi.object({
        // name: Joi.string().required(),
        // email: Joi.string().required(),
        // password: Joi.string().required(),
        // role: Joi.string().required(),

    });
    return schema.validate(order);
}

exports.Order = Order;
exports.orderValidate = orderValidate;
exports.orderSchema = orderSchema;
