const Joi = require('joi');
const mongoose = require('mongoose');

const customerSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    wallet: {
        type: Number,
        required: true,
    }
});

const Customer = mongoose.model('Customer', customerSchema);

function customerValidate(customer) {
    const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().required(),
        password: Joi.string().required(),
        address: Joi.string().required(),
        wallet: Joi.number().required(),
        role: Joi.string().required(),
    });
    return schema.validate(customer);
}

exports.Customer = Customer;
exports.customerValidate = customerValidate;
exports.customerSchema = customerSchema;
