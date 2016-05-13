var express = require('express');
var router = express.Router();

var websiteName = 'Website Name';

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: websiteName });
});

module.exports = router;
