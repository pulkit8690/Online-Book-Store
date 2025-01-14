const express = require('express');
const productControllers = require('../controllers/user/product');
const isAuth=require('../middleware/isauth');
const router = express.Router();

router.get('/products', productControllers.product);
router.get('/products/:prodId',isAuth,productControllers.specificprod);

router.get('/cart', isAuth,productControllers.getcart);
router.post('/cart',isAuth, productControllers.postcart);
router.post('/cart-delete', isAuth,productControllers.deletespecificcart);

router.get('/orders',isAuth,productControllers.getOrders);
// router.post('/create-orders',isAuth,productControllers.postOrders);
router.get('/', productControllers.addproduct);

router.get('/orders/:orderId',isAuth, productControllers.getInvoice);

router.get('/checkout',isAuth, productControllers.getCheckout);
router.get('/checkout/success',isAuth, productControllers.postOrders);

router.get('/checkout/cancel',isAuth, productControllers.getCheckout);


module.exports = router;
