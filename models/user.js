const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const userSchema=new Schema({
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    resetToken:String,
    resetExpires:Date,
    cart:{
        items:[{
            productid:{
                type:Schema.Types.ObjectId,
                required:true,
                ref:'Product'
            },
            quantity:{
                type:Number,
                required:true
            }
        }
    ]}
})
userSchema.methods.addToCart=function(product){
    const updatedcartitems=[...this.cart.items];
    const cartitemindex=updatedcartitems.findIndex(cp=>{
        return cp.productid.toString()===product._id.toString()
    })
    let newQuantity=1;
    if(cartitemindex>=0){
        newQuantity=updatedcartitems[cartitemindex].quantity+1;
        updatedcartitems[cartitemindex].quantity=newQuantity;
    }else{
        updatedcartitems.push({
            productid:(product._id),
            quantity:newQuantity
        })
    }
    const updatedcart={items:updatedcartitems}
    this.cart=updatedcart;
    return this.save();
}
userSchema.methods.deleteFromCart=function(productid){
    const updatedcart=this.cart.items.filter(cp=>{
        return cp.productid.toString()!=productid.toString();
    })
    this.cart.items=updatedcart;
    return this.save();
}

module.exports=mongoose.model('User',userSchema);