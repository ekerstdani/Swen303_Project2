var express = require('express');
var router = express.Router();

var pg = require('pg');

var database = "postgres://postgres:admin@localhost:5432/swen303";
pg.connect(database, function (err) {
  if (err) {
    console.error('Could not connect to the database.');
    console.error(err);
    return;
  }

  console.log('Connected to database.');
});

var websiteName = 'Website Name';
var signedInUser = '';

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: websiteName, signedInUser: signedInUser, message: "" });
});

router.get('/product', function(req, res) {
  var exampleProduct = {};
  exampleProduct.title = "Test Product";
  exampleProduct.price = "$13.37";
  exampleProduct.description = "This is a test product. Dank af.";

  res.render('product', { title: websiteName, product: exampleProduct, signedInUser: signedInUser });
});

router.get('/login', function(req, res) {
  res.render('login', { title: websiteName, message: "" });
});

router.get('/doLogin', function(req, res) {
  var username = req.query.username;
  var password = req.query.password;

  pg.connect(database, function (err, client, done) {
    if (err) {
      console.error('Could not connect to the database.');
      console.error(err);
      return;
    }

    client.query("SELECT * FROM Users;", function (error, result) {
      done();
      if (error) {
        console.error('Failed to execute query');
        console.error(error);
        return;
      }

      var message = "Invalid username or password.";

      for (var i = 0; i < result.rows.length; i++) {
        if (result.rows[i].username == username) {
          if (result.rows[i].password == password) {
            message = "Signed in successfully.";

            signedInUser = username;
            res.render('index', { title: websiteName, message: message, signedInUser: signedInUser });
          }
          else {
            message = "Incorrect password.";
          }
        }
      }

      res.render('login', { title: websiteName, message: message });
    });
  });
});

router.get('/logout', function(req, res) {
  signedInUser = false;
  res.render('index', { title: websiteName, signedInUser: signedInUser, message: "Signed out successfully." });
});

module.exports = router;
