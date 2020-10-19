// node js default createServer
const express = require('express');//express module
const path=require('path');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const expressValidator = require('express-validator');
const passport = require('passport');
const session = require('express-session');
const app = express();
const http = require('http').createServer(app);
let users = {};
let avatars = {};
let profile = "";

//Passport config
require('./config/passport')(passport);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(passport.initialize());
app.use(passport.session());

const port= process.env.PORT || 8080; 

//connect to mongoDb
mongoose.set('useCreateIndex', true);
mongoose
.connect(process.env.MONGODB_URI || 'mongodb://localhost/defaultDatabase',{ useNewUrlParser: true })
.then(() => console.log( 'Database Connected' ))
.catch(err => console.log( err ));;

let db = mongoose.connection;

app.use(express.static('./views'));

let usersRoute = require('./routes/users');
app.use('/users',usersRoute);


app.use((req,res,next)=>{
  next();
});

app.get('/main',(req,res,next)=>{
  app.locals.user = req.query || null;
  res.sendFile(path.join(__dirname + '/views/main.html'));
});

app.get('/tokenNonExisting',(req,res,next)=>{
  res.sendFile(path.join(__dirname + '/views/tokenNE.html'));
});

app.get('/tokenNoUser',(req,res,next)=>{
  res.sendFile(path.join(__dirname + '/views/tokenNoUser.html'));
});

app.get('/tokenNoEmail',(req,res,next)=>{
  res.sendFile(path.join(__dirname + '/views/tokenNoEmail.html'));
});

app.get('/tokenVerified',(req,res,next)=>{
  res.sendFile(path.join(__dirname + '/views/tokenVerified.html'));
});

app.get('/successVerification',(req,res,next)=>{
  res.sendFile(path.join(__dirname + '/views/successVerification.html'));
});

app.get('/profile', (req,res,next)=>{
  res.send(app.locals.user);
});

app.get('/wrongLogin', (req,res,next)=>{
  res.sendFile(path.join(__dirname + '/views/wrongLogin.html'));
});

app.get('/wrongUser', (req,res,next)=>{
  res.sendFile(path.join(__dirname + '/views/registerUser.html'));
});

app.get('/wrongEmail', (req,res,next)=>{
  res.sendFile(path.join(__dirname + '/views/registerEmail.html'));
});

app.get('/wrongPass', (req,res,next)=>{
  res.sendFile(path.join(__dirname + '/views/registerPass.html'));
});

app.get('/sign-up', (req,res,next)=>{
  res.sendFile(path.join(__dirname + '/views/register.html'));
});

app.get('/login', (req,res,next)=>{
    res.sendFile(path.join(__dirname + '/views/index.html'));
});

app.get('/successRegistration',(req,res,next)=>{
    res.sendFile(path.join(__dirname + '/views/successRegistration.html'));
});



const server = app.listen(port,()=>{
  console.log(`App running on port ${port}`);
});

var io = require('socket.io').listen(server);

io.on('connection', function(socket){

  function updateNicknames(){
    var anobject = { "usernames": Object.keys(users), "avatars": avatars };
    io.sockets.emit('usernames', anobject);
  }

  socket.on('chat message',(data,callback)=>{
    var msg = data.trim();
    db.collection("messages").insertOne({username: socket.nickname, msg: msg, room: socket.room, date: new Date()});
    var receiver = socket.room;
    if(receiver!=null){
      receiver = receiver.replace(socket.nickname,"");
      receiver = receiver.replace("_","");
    }
    if(users[receiver]!=null){
      io.to(users[receiver].id).emit('alert_msg',{name:socket.nickname});
    }
    io.to(socket.room).emit("new message", {msg: msg , nick: socket.nickname, room: socket.room, date: new Date()});
  });

  socket.on('typing', (data)=>{
    io.to(socket.room).emit('display_typing',{username: data,room: socket.room});
  });

  socket.on('remove_typing',(data)=>{
    io.to(socket.room).emit('remove_typing_display',{username:data,room: socket.room});
  });

  socket.on('new user', (data,callback)=>{
    if(data in users){
      callback(false);
    }else{
      callback(true);
      socket.nickname = data;
      users[socket.nickname] = socket; //socket.id
      avatars[socket.nickname] = app.locals.user.avatar;
      updateNicknames();
    }
  });

  socket.on('join', (data)=>{
    db.collection("messages").find({"room":data.room}).toArray((err,result)=>{
      if(err) throw err;
      socket.emit('load old messages', result);
    })
    socket.join(data.room);
    socket.room = data.room;
  });

  socket.on('disconnect',(data)=>{
    if(!socket.nickname) return;
    delete users[socket.nickname];
    updateNicknames();
  });

});
