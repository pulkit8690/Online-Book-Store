const { default: mongoose } = require('mongoose');
const Product=require('../../models/product');
const User = require('../../models/user');
const {validationResult}=require('express-validator');
// const User=require('../models/user');
const fileHelper=require('../../util/file');


const getaddproduct = (req, res, next) => {
  
  res.render("admin/add-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    oldInput:{},
    errorMessage:'',
    validationError:[]
  });
};


const postaddproduct = (req, res, next) => {
  const title=req.body.title;
  const image=req.file;
  const description=req.body.description;
  const price=req.body.price;
  console.log(image.path);
  if(!image){
    return res.render("admin/add-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      oldInput:{
        title:title,
        price:price,
        description:description
      },
      errorMessage:'Attached Image not found',
      validationError:[]
    });
  }
  const errors=validationResult(req);
  if(!errors.isEmpty()){
    console.log(errors)
    return res.render("admin/add-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      oldInput:{
        title:title,
        price:price,
        description:description
      },
      errorMessage:errors.array()[0].msg,
      validationError:errors.array()
    });
  }
  const imgurl=image.path;
  console.log(image);
  const product=new Product({
    title:title,
    imgurl:imgurl,
    description:description,
    price:price,
    userId:req.user
  });
  product.save()
  .then(result=>{
    console.log(result);
    res.redirect('/')
  })
  .catch(err=>{
    console.log(err)
    const error=new Error(err);
    error.statusCode=500;
    return next(error);
  })
  
};
const changeproduct = (req, res, next) => {
  Product.find({userId:req.user._id})
  // .select('title price -_id')----for conditions
  // .populate('userId','name')---for opening userid field
  .then(product=>{
    // console.log(product)
    res.render("admin/changeproduct", {
    prods:product,
    pageTitle: "Admin Product",
    path: "/admin/admin-products",
    isAuthenticated:req.session.isLogged
  })
})
.catch(err=>{
  console.log(err)
  const error=new Error(err);
  error.statusCode=500;
  return next(error);
})
  
};

const editgetproduct=(req,res,next)=>{
  const prodId=req.params.ProdId;
  console.log(prodId)
  Product.findById(prodId)
  .then(prod=>
    res.render('admin/edit',{
    product:prod,
    pageTitle:'edit product',
    path:'/admin/editproduct',
    isAuthenticated:req.session.isLogged,
    errorMessage:'',
    validationError:[]
  }))
  .catch(err=>{
    console.log(err)
    const error=new Error(err);
    error.statusCode=500;
    return next(error);
  })
  
};
const editpostproduct=(req,res,next)=>{
  const { prodId, title, price, description} = req.body;
  const image=req.file;
  const errors=validationResult(req);
  if(!errors.isEmpty()){
    return res.render("admin/edit", {
      pageTitle: "Edit Product",
      path: "/admin/editproduct",
      product:{
        title:title,
        price:price,
        description:description,
        _id:prodId
      },
      errorMessage:errors.array()[0].msg,
      validationError:errors.array()
    })}
  Product.findById(prodId).then(product=>{
    if(product.userId.toString()!==req.user._id.toString()){
      return res.redirect('/');
    }
    product.title=title;
    product.price=price;
    product.description=description;
    if(image){
      fileHelper.deleteFile(product.imgurl);
      product.imgurl=image.path;
    }
    
    return product.save()
    .then(()=>res.redirect('/admin/admin-products'))
  })
  .catch(err=>{
    console.log(err)
    const error=new Error(err);
    error.statusCode=500;
    return next(error);
  })
  
  
};

const deleteproduct=(req,res,next)=>{
  const prodId=req.params.prodId;
  Product.findById(prodId).then(prod=>{
    if(!prod){
      return next(new Error('Product not found'));
    }
    fileHelper.deleteFile(prod.imgurl);
    return Product.deleteOne({_id:prodId,userId:req.user._id})
  })
  
  .then(()=>
    res.status(200).json({message:'success'})
  )
  .catch(err=>{
    res.status(500).json({message:'failed'})
  })
}

exports.getaddproduct = getaddproduct;
exports.postaddproduct = postaddproduct;
exports.changeproduct = changeproduct;
exports.editgetproduct = editgetproduct;
exports.editpostproduct = editpostproduct;
exports.deleteproduct = deleteproduct;

