const User=require('../../models/user')
const bcrypt=require('bcryptjs')
const crypto=require('crypto')

const {sendMail}=require('./sendingmail')
const {validationResult}=require('express-validator');

exports.getlogin=(req,res,next)=>{
    let invalidmail=req.flash('error');
    console.log(invalidmail);
    if(invalidmail.length>0){
        invalidmail=invalidmail[0];
    }else{
        invalidmail=null;
    }
    res.render('login/login',{
        path:'/login',
        pageTitle:'Login',
        message:invalidmail,
        oldInput:{}
    })
}
exports.postlogin=(req,res,next)=>{
    const email=req.body.email;
    const passwd=req.body.password;
    User.findOne({email:email})
    .then(user=>{
        if(!user){
            return res.render('login/login',{
                path:'/login',
                pageTitle:'Login',
                message:'Invalid email or password',
                oldInput:{
                    email:email,
                    password:passwd
                }
            })
        }
        bcrypt.compare(passwd,user.password)
        .then(doMatch=>{
            if(!doMatch){
                return res.render('login/login',{
                    path:'/login',
                    pageTitle:'Login',
                    message:'Invalid email or password',
                    oldInput:{
                        email:email,
                        password:passwd
                    },
                    validationError:[]
                })
            }
            req.session.isLogged=true;
            req.session.user=user;
            return req.session.save(err=>{
                console.log(err);
                res.redirect('/');
            })
        })
    })
    .catch(err=>{
        console.log(err)
        const error=new Error(error);
        error.statusCode=500;
        return next(error);
      })
}
exports.logout=(req,res)=>{
    req.session.destroy(err=>{
        console.log(err);
        console.log('logged out')
        res.redirect('/');
    });
}
exports.getsignup=(req,res)=>{
    let message=req.flash('error');
    if(message.length>0){
        message=message[0]
    }else{
        message=null
    }
    res.render('login/signup',{
        path:'/signup',
        pageTitle:'Sign Up Now',
        isAuthenticated:false,
        error:message,
        oldInput:{email:'',password:'',confirmPassword:''},
        validationError:[]
    })
}
exports.postsignup=(req,res,next)=>{
    const email=req.body.email;
    const passwd=req.body.password;
    const confirmpasswd=req.body.confirmPassword;
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors)
        return res.status(422).render('login/signup',{
        path:'/signup',
        pageTitle:'Sign Up Now',
        isAuthenticated:false,
        error:errors.array()[0].msg,
        oldInput:{email:email,password:passwd,confirmPassword:confirmpasswd},
        validationError:errors.array()
    })
    }
    bcrypt.hash(passwd,12)
        .then(hashPasswd=>{
            const user =new User({
                email:email,
                password:hashPasswd,
                cart:{items:[]}
            })
            return user.save()
        })
        .then(result=>{
            res.redirect('/login');
            return sendMail(email,"Welcome",'Hello, welcome to our service!',
            '<b>Hello, welcome to our service!</b>');
        })
        .catch(err=>{
            console.log(err)
            const error=new Error(error);
            error.statusCode=500;
            return next(error);
          })
};

exports.getreset=(req,res,next)=>{
    let message=req.flash('error');
    if (message.length>0) {
        message=message[0]
    }else{
        message=null
    }
    res.render('login/reset',{
        path:'/reset',
        pageTitle:'Reset password',
        error:message
    })
}

exports.postReset=(req,res,next)=>{
    const email=req.body.email;
    crypto.randomBytes(32,(err,buffer)=>{
        if(err){
            console.log(err)
            return res.redirect('/');
        }
        const token=buffer.toString('hex');
        User.findOne({email:email})
        .then(user=>{
            if(!user){
                req.flash('error','User not Found');
                throw new Error('User not found');
            }
            user.resetToken=token;
            user.resetExpires=Date.now()+3600000//+1hr
            return user.save()
        })
        .then(result=>{
            if(result){

                return sendMail(email,"Reset Password","reset now",`<p>You requested for a password Reset.</p>
                    <p>click here to reset <a href="http://localhost:3000/reset/${token}">link</a>`);
            }
            
        })
        .then(()=>{
            req.flash('success', 'Password reset email sent');
            return res.redirect('/');
        })
        .catch(err=>{

            console.log(err)
            res.redirect('/reset');
        })
    })
}


exports.getnewpassword=(req,res,next)=>{
    const token=req.params.token;
    User.findOne({resetToken:token,resetExpires:{$gt:Date.now()}})
    .then(user=>{
        let message=req.flash('error');
        if (message.length>0) {
            message=message[0]
        }else{
            message=null
        }
        res.render('login/resetpassword',{
            path:'/reset',
            pageTitle:'Reset password',
            error:message,
            userId:user._id.toString(),
            token:token
        })
    })
    .catch(err=>{
        console.log(err)
        const error=new Error(error);
        error.statusCode=500;
        return next(error);
      })
}

exports.postNewPassword=(req,res,next)=>{
    const token=req.body.token;
    const newpassword=req.body.password;
    const userId=req.body.userId;
    let resetUser;
    User.findOne({resetToken:token,resetExpires:{$gt:Date.now()},_id:userId})
    .then(user=>{
        resetUser=user;
        return bcrypt.hash(newpassword,12)
    })
    .then(hashPasswd=>{
        resetUser.password=hashPasswd;
        resetUser.resetToken=undefined;
        resetUser.resetExpires=undefined;
        return resetUser.save()
    })
    .then(result=>{
        res.redirect('/login');
    })
    .catch(err=>{
        console.log(err)
        const error=new Error(error);
        error.statusCode=500;
        return next(error);
      })
}
