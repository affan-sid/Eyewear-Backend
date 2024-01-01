const Joi = require('joi');
const mongoose = require('mongoose');

const adminSchema = mongoose.Schema({
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
    }
});

const Admin = mongoose.model('Admin', adminSchema);

function adminValidate(admin) {
    const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().required(),
        password: Joi.string().required(),
        role: Joi.string().required(),
    });
    return schema.validate(admin);
}

exports.Admin = Admin;
exports.validateAdmin = adminValidate;
exports.adminSchema = adminSchema;
