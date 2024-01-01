const mongoose = require('mongoose');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const shopProdSchema = new mongoose.Schema({
    shop: {
        type: new mongoose.Schema({
            name: {
                type: String,
                required: true
            },
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
            }

        }),
        required: true
    },
    prod_name: {
        type: String,
        required: true
    },
    quan: {
        type: Number,
        required: true
    },
    unit_price: {
        type: Number,
        required: true
    }

});

const shopProd = mongoose.model('shopProduct', shopProdSchema);

function shopProdValidate(shopProd) {
    const schema = Joi.object({
        shop_id: Joi.objectId(),
        product_name: Joi.string(),
        quan: Joi.number().required(),
        unit_price: Joi.number().required()
    });
    return schema.validate(shopProd);
}

exports.shopProd = shopProd;
exports.shopProdValidate = shopProdValidate;