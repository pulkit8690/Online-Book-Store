const Order = require('../../models/order');
const Product=require('../../models/product');
const fs=require('fs');
const path=require('path');
const PDFDocument=require('pdfkit');
const stripe=require('stripe')('stripe key');
const Items_per_page=2;

const addproduct=(req, res, next) => {
    const page=+req.query.page || 1;//+ for converting to number if no query param then page=1 by default
    let totalItems;
    Product.find().countDocuments()
    .then(numProducts=>{
      totalItems=numProducts;
      return Product.find().skip((page-1)*Items_per_page)
      .limit(Items_per_page)
    })
    .then(products=>{
      res.render('shop/shop', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage:page,
        totalProducts:totalItems,
        hasNextPage:(Items_per_page*page)<totalItems,
        hasPreviousPage:page>1,
        nextPage:page+1,
        prevPage:page-1,
        lastPage:Math.ceil(totalItems/Items_per_page)
      })
    })
    .catch(err=>{
      console.log(err)
      const error=new Error(err);
      error.statusCode=500;
      return next(error);
    })
};
const product=(req, res, next) => {
    const page=+req.query.page || 1;//+ for converting to number if no query param then page=1 by default
    let totalItems;
    Product.find().countDocuments()
    .then(numProducts=>{
      totalItems=numProducts;
      return Product.find().skip((page-1)*Items_per_page)
      .limit(Items_per_page)
    })
    .then(products=>{
      res.render('shop/product', {
        prods: products,
        pageTitle: 'Products',
        path: '/products',
        currentPage:page,
        totalProducts:totalItems,
        hasNextPage:(Items_per_page*page)<totalItems,
        hasPreviousPage:page>1,
        nextPage:page+1,
        prevPage:page-1,
        lastPage:Math.ceil(totalItems/Items_per_page)
      })
    })
    .catch(err=>{
      console.log(err)
      const error=new Error(err);
      error.statusCode=500;
      return next(error);
    })  
};



const specificprod=(req,res,next)=>{
  const prodId=req.params.prodId;
  console.log(prodId);
  Product.findById(prodId)
  .then((rows)=>{
    res.render('shop/specificprod',{
    prod:rows,
    pageTitle:rows.title,
    path:'/products'})})
    .catch(err=>{
      console.log(err)
      const error=new Error(err);
      error.statusCode=500;
      return next(error);
    })
}

const getcart=(req, res, next) => {
  req.user.populate('cart.items.productid')
  .then(user=>{
    const cartItems = user.cart.items.map(item => {
      return {
        product: item.productid,
        quantity: item.quantity
      };
    });
    console.log(cartItems)
    
    res.render('shop/cart', {
      cart: cartItems,
      
      pageTitle: 'Cart',
      path: '/cart'
    })
  }
  )
  .catch(err=>{
    console.log(err)
    const error=new Error(err);
    error.statusCode=500;
    return next(error);
  })
};
const postcart=(req,res)=>{

  const prodId=req.body.ProdId;
  
  Product.findById(prodId)
  .then(product=>{
    return req.user.addToCart(product)
  })
  .then(result=>{
    console.log(result)
    res.redirect('/cart');
})
}

const deletespecificcart=(req,res,next)=>{
  const productId=req.body.productId;
  req.user.deleteFromCart(productId)
  .then(()=>{

    res.redirect('/cart')
  })
  .catch(err=>{
    console.log(err)
    const error=new Error(err);
    error.statusCode=500;
    return next(error);
  })
}

const postOrders=(req,res,next)=>{//IMP--------------------------
  req.user.populate('cart.items.productid')
  .then(user=>{
    const cartItems = user.cart.items.map(item => {
      return {
        product: {...item.productid._doc},//_doc only raw data
        quantity: item.quantity
      };
    })
    const order=new Order({
      user:{
        email:req.user.email,
        userid:req.user
      },
      products:cartItems
    });
    return order.save()
  })
  .then(()=>{
    req.user.cart.items=[]
    return req.user.save();
  })
  .then(()=>res.redirect('/orders'))
  .catch(err=>{
    console.log(err)
    const error=new Error(err);
    error.statusCode=500;
    return next(error);
  })
}
const getOrders=(req,res,next)=>{
  Order.find({"user.userid":req.user._id})//nested checking
  .then(orders=>{
    const current=new Date();
    
    res.render('shop/orders',{
      path:'/orders',
      pageTitle:'Orders',
      orders:orders,
      date:current
    })
  })
}

const getInvoice=(req,res,next)=>{
  const orderId=req.params.orderId;
  Order.findById(orderId).then(order=>{
    if(!order){//undefined
      return next(new Error('Not found'));
    }
    if(order.user.userid.toString()!== req.user._id.toString()){
      return next(new Error('unauthorised'));
    }

    const invoicename='invoice - '+orderId+'.pdf';
    const invoicePath=path.join('data','Invoice',invoicename);
    const pdfDoc=new PDFDocument();
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','inline;filename="'+invoicename+'"');
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);
    pdfDoc.fontSize(26).text('Invoice');
    pdfDoc.text('---------------------------');
    let totalPrice=0;
    order.products.forEach(prod => {
      totalPrice+=(prod.quantity*prod.product.price);
      pdfDoc.fontSize(14).text(prod.product.title+' = '+prod.quantity+' * $'+prod.product.price);

    });
    pdfDoc.text('------');
    pdfDoc.fontSize(20).text('Total Price - $'+totalPrice);

    pdfDoc.end();
    
  })
}

const getCheckout=(req,res,next)=>{
  let cartItems;
  let total;
  req.user.populate('cart.items.productid')
  .then(user=>{
    cartItems = user.cart.items.map(item => {
      return {
        product: item.productid,
        quantity: item.quantity
      };
    });
    console.log(cartItems)
    total=0;
    cartItems.forEach(p => {
      total+=p.quantity*p.product.price
    });
    return stripe.checkout.sessions.create({
      payment_method_types:['card'],
      line_items:cartItems.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product.title,
            description: item.product.description,
          },
          unit_amount: item.product.price * 100, // Stripe expects amount in cents
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url:req.protocol+'://'+req.get('host')+'/checkout/success',
      cancel_url:req.protocol+'://'+req.get('host')+'/checkout/cancel'
    })
  })
    .then(session=>{

      res.render('shop/checkout', {
        cart: cartItems,
        sessionId:session.id,
        pageTitle: 'Checkout',
        path: '/checkout',
        totalPrice:total
      })
    })
  .catch(err=>{
    console.log(err)
    const error=new Error(err);
    error.statusCode=500;
    return next(error);
  })
}

exports.addproduct=addproduct;
exports.specificprod=specificprod;
exports.product=product;
exports.deletespecificcart=deletespecificcart;
exports.getcart=getcart;
exports.postcart=postcart;
exports.postOrders=postOrders;
exports.getOrders=getOrders;
exports.getInvoice=getInvoice;
exports.getCheckout=getCheckout;