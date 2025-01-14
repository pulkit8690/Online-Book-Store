const express = require('express');
const router = express.Router();
const addproductControllers=require('../controllers/admin/addproduct')
const isAuth=require('../middleware/isauth');
const {body}=require('express-validator')

// /admin/add-product => GET
router.get('/add-product', isAuth,addproductControllers.getaddproduct);
router.get('/admin-products', isAuth,addproductControllers.changeproduct);
router.get('/edit-product/:ProdId',isAuth, addproductControllers.editgetproduct);

// /admin/add-product => POST
router.post('/add-product',
    [
        body('title','Invalid title').isLength({min:2}).isString().trim(),
        body('price','Invalid price').isFloat(),
        body('description','Invalid description').isLength({min:2,max:50}).trim(),

    ],isAuth,addproductControllers.postaddproduct);
router.post('/edit-product',[
    body('title','Invalid title').isLength({min:2}).isString().trim(),
    
    body('price','Invalid price').isFloat(),
    body('description','Invalid description').isLength({min:2,max:50}).trim(),
    ]
    ,isAuth, addproductControllers.editpostproduct);
router.delete('/admin-products/:prodId',isAuth, addproductControllers.deleteproduct);

exports.routes = router;
