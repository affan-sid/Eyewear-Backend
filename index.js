const express = require('express');
const Joi = require('joi');
const mongoose = require('mongoose');
const admin = require('./router/admin');
const shop = require('./router/shop');
const shopProd = require('./router/shopProd');
const customer = require('./router/customer');
const order = require('./router/order');
const config = require('config');
const cookieParser = require('cookie-parser');
const cors = require('cors');


if (!config.get('jwtPrivateKey')) {
    console.error('Fatal error: jwt key is not defined!');
    process.exit(1);
}


mongoose.connect('mongodb://localhost/EyeWear')
    .then(() => { console.log('connected to Mongodb') })
    .catch(err => console.error('Error connecting to db', err));

const app = express();
app.use(cors({ credentials: true, origin: "http://localhost:3001" }));
app.use(cookieParser());
app.use(express.json());
app.use('/api/admin', admin);
app.use('/api/shop', shop);
app.use('/api/shopProd', shopProd)
app.use('/api/customer', customer)
app.use('/api/order', order)

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening at port ${port}`);
});