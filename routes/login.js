const express=require('express');
const router=express.Router();
const authRoutes=require('../controllers/auth/auth');
const {check,body}=require('express-validator');
const User = require('../models/user');

router.get('/login',authRoutes.getlogin);
router.post('/post-login',authRoutes.postlogin);
router.get('/logout',authRoutes.logout);
router.get('/signup',authRoutes.getsignup);
router.post('/signup',
    [check('email').isEmail().normalizeEmail().withMessage('Invalid email try again').custom((value)=>{
        return User.findOne({email:value}).then(userDoc=>{
            if(userDoc){
                return Promise.reject('Email already exists');
            }
        })
    }),
        body('password','enter password with atleast 5 characters').isLength({min:5}).isAlphanumeric().trim(),
        body('confirmPassword').trim().custom((value,{req})=>{//custom validator
            if(value!==req.body.password){
                throw new Error('passwords do not match');
            }
            return true;
        })],
    authRoutes.postsignup);
router.get('/reset',authRoutes.getreset);
router.post('/reset',authRoutes.postReset);
router.get('/reset/:token',authRoutes.getnewpassword);
router.post('/newpassword',authRoutes.postNewPassword);

module.exports=router;