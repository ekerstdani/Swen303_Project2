var express = require('express');
var router = express.Router();

var websiteName = 'Website Name';

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: websiteName });
});

router.get('/product', function(req, res) {
  var exampleProduct = {};
  exampleProduct.title = "Test Product";
  exampleProduct.price = "$13.37";
  exampleProduct.description = "This is a test product. Dank af.";

  res.render('product', { title: websiteName, product: exampleProduct });
});

router.get('/login', function(req, res) {
  res.render('login', { title: websiteName });
});

module.exports = router;
