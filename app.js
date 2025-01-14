const path = require('path');
const express = require('express');
const mongoose=require('mongoose');
const error = require('./controllers/404');
const User=require('./models/user')

const bodyParser = require('body-parser');
const multer = require('multer');

const session=require('express-session');
const MongodbStore=require('connect-mongodb-session')(session);

const flash=require('connect-flash');

const csrf=require('csurf');

const app = express();

const csrfProtection=csrf();

const link='mongo key'

const store=new MongodbStore({
    uri:link,
    collection:'sessions'
});

const fileStorage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'images');
    },
    filename:(req,file,cb)=>{
        cb(null,new Date().toISOString().replace(/:/g, '-')+'-'+file.originalname);// Replace colons to make filename safe
    }
})
const fileFilter=(req,file,cb)=>{
    if(file.mimetype==='image/png' || file.mimetype==='image/jpg' ||file.mimetype==='image/jpeg'){
        cb(null,true);
    }else{
        cb(null,false);

    }
}

app.set('view engine', 'ejs');
app.set('views', 'views');


const adminData = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/login');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage:fileStorage,fileFilter:fileFilter}).single('image'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));
app.use(session({
    secret:'my secret',
    resave:false,
    saveUninitialized:false,
    store:store
    })
)
app.use(csrfProtection);
app.use(flash());

app.use((req,res,next)=>{
    if(!req.session.user){
        return next();
    }
    User.findById(req.session.user._id)
    .then(user=>{
        // throw new Error('dummy');
        if(!user){
            return next();
        }
        req.user=user;
        next();
    })
    .catch(err=>next(new Error(err)))
})

app.use((req,res,next)=>{
    res.locals.isAuthenticated=req.session.isLogged;
    res.locals.csrfToken=req.csrfToken();
    next();
})
app.use('/admin', adminData.routes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500',error.get505);
app.use(error.get404);

app.use((error,req,res,next)=>{
    res.status(500).render('500', { pageTitle: 'Error!',path:'',isAuthenticated:false});
})

mongoose.connect(link)
.then(()=>{
    app.listen(3000)
    }
)
.catch(err=>console.log(err))



