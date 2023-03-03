//jshint esversion:10
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

// configure express session
app.use(
  session({
    secret: "This is our little secret but use environment variable instead.",
    resave: false,
    saveUninitialized: false
  })
);

// initialize passport and configure  to use session
app.use(passport.initialize());
app.use(passport.session());

//connect to db
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
  console.log("Successfully connected to DB");
});

// create schema for collection
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// configure passportLocalMongoose as plugin to db schema
userSchema.plugin(passportLocalMongoose);

//create collection and collecte to it.
const User = mongoose.model("User", userSchema);

//configure passport strategy
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    console.log("User authenticate Successfully");
    res.render("secrets", {title: "register"});
  } else {
    console.log("User not authorized");
    res.redirect("/login");
  }
});

app.get("/secrets/:title", (req, res) => {
  if (req.isAuthenticated()) {
    console.log("User authenticate Successfully");
    res.render("secrets", {title: req.params.title});
  } else {
    console.log("User not authorized");
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  User.register(
    {username: req.body.username},
    req.body.password,
    (err, newUser) => {
      if (err) {
        // res.send(err);
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/secrets");
        });
      }
    }
  );
});

/*app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/"
  })
);*/

app.post("/login", (req, res) => {
  const username = req.body.username;
  const pwd = req.body.password;

  const user = new User({
    username: username,
    password: pwd
  });

  req.login(user, err => {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, (err, user) => {
        console.log(" authenicating user");
        res.redirect("/secrets/login");
      });
    }
  });
});

app.listen(process.env.PORT || 3000, (req, res) => {
  console.log("Server started at port 3000");
});
