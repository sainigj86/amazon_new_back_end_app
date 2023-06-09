const express = require('express');
const adminRouter = express.Router();
const admin = require("../middlewares/admin");
const { Product } = require('../model/product');
const Order = require('../model/order');
const User = require('../model/user');


//add product
adminRouter.post('/admin/add-product', admin, async (req, res) => {
    try {
        const { name, description, images, quantity, price, category, merchantId } = req.body;
        // console.log("merchantId = " + JSON.stringify(req.body));
        let product = new Product({
            name,
            description,
            images,
            quantity,
            price,
            category,
            merchantId,
        });
        product = await product.save();
        res.json(product);
    } catch (e) {
        console.log("errrror " + e);
        res.status().json({ error: e.message });
    }
});

//get all your products

adminRouter.post("/admin/get-product", admin, async (req, res) => {
    try {
        // console.log("merchantId = " + products);
        var merchantId = req.body.merchantId;
        // console.log("merchantId = " + merchantId);

        const products = await Product.find({ merchantId: merchantId });
        // console.log("products = " + JSON.stringify(products));
        res.json(products);
    } catch (e) {
        console.log("errror " + e)
        res.json({ error: e.message });
    }
});


adminRouter.post("/admin/delete-product", admin, async (req, res) => {
    try {
        const { id } = req.body;
        let product = await Product.findByIdAndDelete(id);
        res.json(product);
    } catch (e) {
        res.status.json({ error: e.message });
    }
});

adminRouter.post("/admin/get-orders", admin, async (req, res) => {
    try {
        const { merchantId } = req.body;
        // console.log("Merchant ID:", merchantId);
        const orders = await Order.find({})
            .populate({
                path: 'products.product',
                match: { merchantId: merchantId },
            })
            .exec();
        // Filter out orders with unmatched products
        const filteredOrders = orders.filter((order) =>
            order.products.some(
                (product) => product.product && product.product.merchantId === merchantId
            )
        );

        console.log(filteredOrders);
        res.json(filteredOrders);
    } catch (e) {
        res.json({ error: e.message });
    }
});

adminRouter.post("/admin/change-order-status", admin, async (req, res) => {
    try {
        const { id, status } = req.body;
        let order = await Order.findById(id);
        order.status = status;
        order = await order.save()
        res.json(order);
    } catch (e) {
        res.status.json({ error: e.message });
    }
});

adminRouter.get("/admin/analytics", admin, async (req, res) => {
    try {
        const orders = await Order.find({});
        let totalEarnings = 0;

        for (let i = 0; i < orders.length; i++) {
            for (let j = 0; j < orders[i].products.length; j++) {
                orders[i].products[j].quantity * orders[i].products[j].product.price;
            }
        }
        //Category wise order fetchign
        let mobileEarnings = await fetchCategoryWiseProduct("Mobiles");
        let essentialEarnings = await fetchCategoryWiseProduct("Essentials");
        let applianceEarnings = await fetchCategoryWiseProduct("Appliances");
        let booksEarnings = await fetchCategoryWiseProduct("Books");
        let fashionEarnings = await fetchCategoryWiseProduct("Fashion");

        let earnings = {
            totalEarnings,
            mobileEarnings,
            essentialEarnings,
            applianceEarnings,
            booksEarnings,
            fashionEarnings,
        };

        res.json(earnings);
    } catch (e) {
        res.status.json({ error: e.message });
    }
});

async function fetchCategoryWiseProduct(category) {
    let earnings = 0;
    let categoryOrders = await Order.find({
        "products.product.category": category,
    });

    for (let i = 0; i < categoryOrders.length; i++) {
        for (let j = 0; j < categoryOrders[i].products.length; j++) {
            earnings +=
                categoryOrders[i].products[j].quantity *
                categoryOrders[i].products[j].product.price;
        }
    }
    return earnings;
}

module.exports = adminRouter;