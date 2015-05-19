//import libraries 
var nodemailer = require('nodemailer'); //Emailer
var path = require('path'); 
var express = require('express');  
var compression = require('compression');  
var favicon = require('serve-favicon'); 
var cookieParser = require('cookie-parser'); 
var bodyParser = require('body-parser'); 
var mongoose = require('mongoose'); 
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var url = require('url');
 
var dbURL = process.env.MONGOLAB_URI || "mongodb://localhost/PetMaker";

var db = mongoose.connect(dbURL, function(err) {
    if(err) {
        console.log("Could not connect to database");
        throw err;
    }
});

var redisURL = {
    hostname: 'localhost',
    port: 6379
};

var redisPASS;

if(process.env.REDISCLOUD_URL) {
    redisURL = url.parse(process.env.REDISCLOUD_URL);
    redisPASS = redisURL.auth.split(":")[1];
}

//pull in our routes
var router = require('./router.js'); 

var server;  
var port = process.env.PORT || process.env.NODE_PORT || 3000; 

var app = express(); 
app.use('/assets', express.static(path.resolve(__dirname+'../../client/'))); 
app.use(compression()); 
app.use(bodyParser.urlencoded({ 
  extended: true                
}));                            
app.use(session({
    store: new RedisStore({
        host: redisURL.hostname,
        port: redisURL.port,
        pass: redisPASS
    }),
    secret: 'Domo Arigato',
    resave: true,
    saveUninitialized: true
}));    
app.set('view engine', 'jade'); 
app.set('views', __dirname + '/views'); 
app.use(favicon(__dirname + '/../client/img/favicon.png')); 
app.use(cookieParser()); 

//Email
console.log("ROUTER CONTACT: "+router.contact);
app.get("/contact", router.contact);

app.post("/contact", function(req, res){
    var mailOpts, smtpTrans;
    
    //Setup SMTP Transport
    smtpTrans = nodemailer.createTransport("SMTP",{
        service: "Gmail",
        auth:{
            user: "12brockwelld@gmail.com",
            pass: "Middwhisp456~"
        }
    });
    
    //Mail Options
    mailOpts = {
        from: req.body.name + "&lt" + req.body.email + "&gt;",
        to: "12brockwelld@gmail.com",
        subject: "Buddi Contact",
        text: req.body.message
    };
    
    smtpTrans.sendMail(mailOpts, function(error,response){
        //Error no email
        if(error){
            res.render("contact", {title: "Buddi Contact", msg: "Error, message not sent.", err: true, page: "contact"})
        }
        //Sent
        else{
            res.render("contact", {title: "Buddi Contact", msg: "Message sent!", err: false, page: "contact"})
        }
    });
});

router(app); 

server = app.listen(port, function(err) { 
    if (err) {
      throw err;
    }
    console.log('Listening on port ' + port);
});