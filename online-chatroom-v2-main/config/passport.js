const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const express = require('express');
const app = express();

module.exports = function(passport,req,res){
  //Local Strategy
  passport.use(new LocalStrategy(function(username,password, done){
    //Match email
    let query = {username:username};
    User.findOne(query, function(err, user){
      if(err) throw err;
      if(!user){
        return done(null,false,{message: 'No user found'});
      }

      //Match passwords
      bcrypt.compare(password, user.password, function(err,isMatch){
          if(err) throw err;
          if(!user.isVerified){
            console.log("Not verified");
            return done(null,false,{message: 'Your account has not been verified.'});
          }
          if(isMatch){
            return done(null, user);
          }else{
            return done(null,false,{message: 'Password does not match!'});
          }
      });

      passport.serializeUser(function(user, done) {
        done(null, user.id);
      });

      passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
        done(err, user);
        });
      });
    });
  }));

}
