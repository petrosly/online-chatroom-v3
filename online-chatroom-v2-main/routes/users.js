require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const crypto = require('crypto');
const randomBytes = require('random-bytes')
const nodemailer = require('nodemailer');



//Bring in User model
let User = require("../models/user");
let Token = require("../models/token");
//nodemailer setup
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth:{
    user: process.env.EMAIL ,
    pass: process.env.PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
})

//Register Proccess
router.post('/register',(req,res,next)=>{
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;
  const passwordConf = req.body.passwordConf;
  const avatar = req.body.avatar;


  User.findOne({username: username}, (err,user)=>{
    if(user){
      console.log("This username is already used! Please try a new one!");
      res.redirect('/wrongUser');
      return false;
    }
    if(err){
      throw(err);
    }
  });

  if(password !== passwordConf){
    console.log("Passwords do not match! Please try again!");
    res.redirect('/wrongPass');
    return false;
  }

  User.findOne({email:email} , (err,user)=>{
    if(user){
      console.log("This email is already used! Please try a new one!");
      res.redirect('/wrongEmail');
      return false;
    }
    if(err){
      throw(err);
    }
  });

  if(req.body.email && req.body.username && req.body.password && req.body.passwordConf){
    let newUser = new User({
      email:email,
      username:username,
      password:password,
      avatar:avatar
    });
    //encode the Password
    bcrypt.genSalt(10,(err,salt)=>{
      bcrypt.hash(newUser.password,salt,(err,hash)=>{
        if(err){
          console.log(err);
        }
        newUser.password = hash;
        newUser.save((err)=>{
          if(err){
            console.log(err);
            return;
          } else{

            var token = new Token({username: newUser.username, token: randomBytes.sync(16).toString('hex') });
            token.save(function (err){
              if(err){
                console.log(err);
                return;
              }
              //mail
              let mailOption = {
                from: 'plymperchat@gmail.com',
                to: newUser.email,
                subject: 'Verify your Chat App account!',
                text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host+'/users' + '\/confirmation\/' + token.token + '\n'
              }

              transporter.sendMail(mailOption, (err, data)=>{
                if(err){
                  console.log('There was an error!');
                  console.log(err);
                }else{
                  console.log('Email sent!');
                }
              });
              
            })

            res.redirect('/successRegistration');
          }
        });
      });
    });
  }
});

//resend token
router.post('/resend/:email', (req,res)=>{
  User.findOne({email: req.params.email}, (err,user)=>{
    if(user != null){
      if(!user){
        res.redirect('/tokenNoUser');
      }
      if(user.isVerified){
        res.redirect('/tokenVerified');
      }

      Token.findOne({username:user.username},(err,token)=>{
        if(err){
          throw(err);
        }
        //mail
        let mailOption = {
          from: 'plymperchat@gmail.com',
          to: user.email,
          subject: 'Verify your Chat App account!',
          text: 'Hello,\n\n' + 'This is a new email for your authentication.\nPlease verify your account by clicking the link: \nhttp:\/\/' + req.headers.host+'/users' + '\/confirmation\/' + token.token + '\n'
        }

        transporter.sendMail(mailOption, (err, data)=>{
          if(err){
            console.log('There was an error!');
            console.log(err);
          }else{
            console.log('Email sent!');
          }
        });
        res.redirect('/');
      });
    }else{
      res.redirect('/tokenNoEmail');
    }
  });
});
//confirmation token get
router.get('/confirmation/:token', (req,res)=>{
  Token.findOne({token: req.params.token}, function(err,token){
    if(!token){
      res.redirect('/tokenNonExisting');
    }

    User.findOne({username:token.username}, (err,user)=>{
      if(!user){
        res.redirect('/tokenNoUser');
      }
      if(user.isVerified){
        res.redirect('/tokenVerified');
      }
      user.isVerified = true;
      user.save(function(err){
        if(err){
          throw(err);
        }
        res.redirect('/successVerification');
      })
    })
  });
});


//Login Procces, using passport with local authentication
router.post('/login', passport.authenticate('local', { failureRedirect: '/wrongLogin' }), function(req, res) {
   res.redirect('/main?username=' + req.user.username+'&avatar=' + req.user.avatar);
});

//Logout Proccess
router.get('/logout', ( req,res,next)=>{
  req.logout();
  res.redirect('/');
});


module.exports = router;