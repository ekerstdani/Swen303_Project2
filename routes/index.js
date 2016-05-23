var express = require('express');
var router = express.Router();

//var pg = require('pg');
var pg = require('pg').native;

//var database = "postgres://postgres:admin@localhost:5432/swen303";
var database = "postgres://depot:5432/swen303g8";
pg.connect(database, function (err) {
  if (err) {
    console.error('Could not connect to the database.');
    console.error(err);
    return;
  }

  console.log('Connected to database.');
});

var websiteName = 'uBuy(WeGetRich)';
var signedInUser = '';
var signedInUserRealname = '';
var signedInUserUID = 0;
var money = 0.0;

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: websiteName, signedInUser: signedInUser, message: "", id: signedInUserUID, money: parseInt(money) });
});

router.get('/browse', function(req, res) {
  pg.connect(database, function (err, client, done) {
    if (err) {
      console.error('Could not connect to the database.');
      console.error(err);
      return;
    }

    var query = "SELECT * FROM Stock WHERE quantity > 0 ";

    if(req.query.sortBy == "lowestPrice")
      query += "ORDER BY price ASC;";
    else if(req.query.sortBy == "highestPrice")
      query += "ORDER BY price DESC;";
    else if(req.query.sortBy == "name")
      query += "ORDER BY lower(label);";
    else if (req.query.sortBy == "newestFirst")
      query += "ORDER BY sid DESC;";
    else if (req.query.sortBy == "username")
      query += "ORDER BY uid ASC;";
    else if (req.query.sortBy == "lowestQuantity")
      query += "ORDER BY quantity ASC;";
    else if (req.query.sortBy == "highestQuantity")
      query += "ORDER BY quantity DESC;";
    else
      query += ";"

    client.query(query, function (error, result) {
      done();
      if (error) {
        console.error('Failed to execute query.');
        console.error(error);
        return;
      }

      var placeholderImage = "https://pbs.twimg.com/profile_images/431293187869519873/FpnWw4sU_400x400.jpeg"

      res.render('browse', { title: websiteName, signedInUser: signedInUser, list: result.rows, placeholderImage: placeholderImage, id: signedInUserUID, money: parseInt(money) });
    });
  });
});

router.get('/product', function(req, res) {
  pg.connect(database, function (err, client, done) {
    if (err) {
      console.error('Could not connect to the database.');
      console.error(err);
      return;
    }

    var query = "SELECT * FROM stock WHERE sid=" + req.query.sid + ";";

    client.query(query, function (error, result) {
      done();
      if (error) {
        console.error('Failed to execute query.');
        console.error(error);
        return;
      }

      var product = result.rows[0];

      client.query("SELECT * FROM users WHERE uid=" + product.uid + ";" , function (error, result) {
        done();
        if (error) {
          console.error('Failed to execute query.');
          console.error(error);
          return;
        }
        if (product.price<=money)
          if (product.quantity > 0) 
            res.render('product', { title: websiteName, signedInUser: signedInUser, product: product, inStock: true, id: signedInUserUID, listedBy: result.rows[0], money: parseInt(money), hasMoney: true});
          else
            res.render('product', { title: websiteName, signedInUser: signedInUser, product: product, inStock: false, id: signedInUserUID, listedBy: result.rows[0], money: parseInt(money), hasMoney: true});
        else
          res.render('product', { title: websiteName, signedInUser: signedInUser, product: product, inStock: true, id: signedInUserUID, listedBy: result.rows[0], money: parseInt(money),hasMoney: false});
      });
    });
  });
});

router.get('/sold', function(req, res) {

  pg.connect(database, function (err, client, done) {
    if (err) {
      console.error('Could not connect to the database.');
      console.error(err);
      return;
    }

    var query = "SELECT * FROM stock WHERE sid=" + req.query.sid + ";";

    client.query(query, function (error, result) {
      done();
      if (error) {
        console.error('Failed to execute query.');
        console.error(error);
        return;
      }

      var product = result.rows[0];

        if (product.quantity > 0){
          var query = "UPDATE stock SET quantity=" + (product.quantity-1) + " WHERE sid=" + product.sid + ";";

          client.query(query, function (error, result) {
            done();
            if (error) {
              console.error('Failed to execute query.');
              console.error(error);
              return;
            }

            var query = "UPDATE users SET money=" + (money - product.price) + " WHERE uid=" + signedInUserUID + ";";

            client.query(query, function (error, result) {
              done();
              if (error) {
                console.error('Failed to execute query.');
                console.error(error);
                return;
              }

              money = money - product.price;
              res.render('sold', { title: websiteName, signedInUser: signedInUser, product: product, id: signedInUserUID, money: parseInt(money) });
            });
          });
        }
        else{
          res.render('product', { title: websiteName, signedInUser: signedInUser, product: product, inStock: false, id: signedInUserUID, money: parseInt(money) });
        }
    });
  });
});

router.get('/login', function(req, res) {
  res.render('login', { title: websiteName, message: req.query.message, redirect: req.query.redirect, id: signedInUserUID, money: parseInt(money) });
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
        console.error('Failed to execute query.');
        console.error(error);
        return;
      }

      var message = "Invalid username or password.";

      for (var i = 0; i < result.rows.length; i++) {
        if (result.rows[i].username == username) {
          if (result.rows[i].password == password) {
            message = "Signed in successfully.";

            signedInUser = username;
            signedInUserRealname = result.rows[i].realname;
            signedInUserUID = result.rows[i].uid;
            money = result.rows[i].money;
            
            res.render('index', { title: websiteName, message: message, signedInUser: signedInUser, id: signedInUserUID, money: parseInt(money) });
          }
          else {
            message = "Incorrect password.";
          }
        }
      }

      res.render('login', { title: websiteName, message: message, redirect: req.query.redirect, id: signedInUserUID, money: parseInt(money) });
    });
  });
});

router.get('/userPage', function(req, res) {
  res.render('userPage', { title: websiteName, signedInUser: signedInUser, realname: signedInUserRealname, message: "", id: signedInUserUID, money: parseInt(money) });
});

router.get('/addItem', function(req, res) {
  res.render('addItem', { title: websiteName, signedInUser: signedInUser, id: signedInUserUID, money: parseInt(money) });
});

router.get('/doAddItem', function(req, res) {
  	pg.connect(database, function (err, client, done) {
    if (err) {
      console.error('Could not connect to the database.');
      console.error(err);
      return;
    }
    
    var query = "INSERT INTO Stock (uid, Label, Price, Quantity, Description, url) VALUES (" +
        signedInUserUID + ", '" +
        req.query.name + "', " +
        req.query.price + ", " +
        req.query.quantity + ", '" +
        req.query.description + "', '" +
        req.query.imageURL + "')" + 
        "RETURNING sid;";

    client.query(query, function (error, result) {
      done();
      if (error) {
        console.error('Failed to execute query.');
        console.error(error);
        return;
      }

      client.query("SELECT * FROM stock WHERE sid=" + result.rows[0].sid + ";", function (error, result) {
        done();
        if (error) {
          console.error('Failed to execute query.');
          console.error(error);
          return;
        }

        res.render('product', { title: websiteName, signedInUser: signedInUser, product: result.rows[0], inStock: true, money: parseInt(money), listedBy: signedInUserUID });

      });
    });
  });
});

router.get('/logout', function(req, res) {
  signedInUser = false;
  res.render('index', { title: websiteName, signedInUser: signedInUser, message: "Signed out successfully.", id: signedInUserUID, money: parseInt(money) });
});

router.get('/changePW', function(req, res) {
  var password = req.query.pw;
  
  if (password != req.query.pwConfirm) {
    res.render('userPage', { title: websiteName, signedInUser: signedInUser, realname: signedInUserRealname, message: "Passwords did not match.", id: signedInUserUID, money: parseInt(money) });
  }
  else {
  pg.connect(database, function (err, client, done) {
    if (err) {
      console.error('Could not connect to the database.');
      console.error(err);
      return;
    }

    client.query("SELECT * FROM Users;", function (error, result) {
      done();
      if (error) {
        console.error('Failed to execute query.');
        console.error(error);
        return;
      }

      for (var i = 0; i < result.rows.length; i++) {
        if (result.rows[i].username == signedInUser) {
          client.query("UPDATE users SET password='" + password + "' WHERE username='" + signedInUser + "';", function (error, result) {
            done();
            if (error) {
              console.error('Failed to execute query.');
              console.error(error);
              return;
            }

            res.render('userPage', { title: websiteName, signedInUser: signedInUser, realname: signedInUserRealname, message: "Successfully changed password.", id: signedInUserUID, money: parseInt(money) });
          });
        }
      }
    });
  });
  }
});

router.get('/changeName', function(req, res) {
  var name = req.query.name;
  
  pg.connect(database, function (err, client, done) {
    if (err) {
      console.error('Could not connect to the database.');
      console.error(err);
      return;
    }

    client.query("SELECT * FROM Users;", function (error, result) {
      done();
      if (error) {
        console.error('Failed to execute query.');
        console.error(error);
        return;
      }

      for (var i = 0; i < result.rows.length; i++) {
        if (result.rows[i].username == signedInUser) {
          client.query("UPDATE users SET realname='" + name + "' WHERE username='" + signedInUser + "';", function (error, result) {
            done();
            if (error) {
              console.error('Failed to execute query.');
              console.error(error);
              return;
            }
				signedInUserRealname = name;
            res.render('userPage', { title: websiteName, signedInUser: signedInUser, realname: signedInUserRealname, message: "Successfully changed name.", id: signedInUserUI, money: parseInt(money) });
          });
        }
      }
    });
  });
});

router.get('/search', function(req, res) {
  pg.connect(database, function (err, client, done) {
    if (err) {
      console.error('Could not connect to the database.');
      console.error(err);
      return;
    }

    var query = "SELECT * FROM stock WHERE label LIKE '%' || '" + req.query.searchTerm + "' || '%' ";

    if(req.query.sortBy == "lowestPrice")
      query += "ORDER BY price ASC;";
    else if(req.query.sortBy == "highestPrice")
      query += "ORDER BY price DESC;";
    else if(req.query.sortBy == "name")
      query += "ORDER BY lower(label);";
    else if (req.query.sortBy == "newestFirst")
      query += "ORDER BY sid DESC;";
    else
      query += ";"

    client.query(query , function (error, result) {
      done();
      if (error) {
        console.error('Failed to execute query.');
        console.error(error);
        return;
      }

      res.render('search', {title: websiteName, signedInUser: signedInUser, list: result.rows, id: signedInUserUID, st: req.query.searchTerm, money: parseInt(money) });
    });
  });
});

router.get('/profile', function(req, res) {
  pg.connect(database, function (err, client, done) {
    if (err) {
      console.error('Could not connect to the database.');
      console.error(err);
      return;
    }

    var query = "SELECT * FROM stock WHERE uid=" + req.query.user + " ";

    if(req.query.sortBy == "lowestPrice")
      query += "ORDER BY price ASC;";
    else if(req.query.sortBy == "highestPrice")
      query += "ORDER BY price DESC;";
    else if(req.query.sortBy == "name")
      query += "ORDER BY lower(label);";
    else if (req.query.sortBy == "newestFirst")
      query += "ORDER BY sid DESC;";
    else
      query += ";"

    client.query(query , function (error, result) {
      done();
      if (error) {
        console.error('Failed to execute query.');
        console.error(error);
        return;
      }

      client.query("SELECT * FROM users WHERE uid=" + req.query.user + ";", function (error, result2) {
        done();
        if (error) {
          console.error('Failed to execute query.');
          console.error(error);
          return;
        }

        res.render('profile', {title: websiteName, signedInUser: signedInUser, list: result.rows, id: signedInUserUID, user: result2.rows[0], money: parseInt(money) });
      });
    });
  });
});

router.get('/editItem', function(req, res) {
  pg.connect(database, function (err, client, done) {
    if (err) {
      console.error('Could not connect to the database.');
      console.error(err);
      return;
    }

    var query = "SELECT * FROM stock WHERE sid=" + req.query.sid + ";";

    client.query(query, function (error, result) {
      done();
      if (error) {
        console.error('Failed to execute query.');
        console.error(error);
        return;
      }

      var product = result.rows[0];

      if (product.quantity > 0)
          res.render('editItem', { title: websiteName, signedInUser: signedInUser, product: product, inStock: true, id: signedInUserUID, money: parseInt(money) });
      else
        res.render('editItem', { title: websiteName, signedInUser: signedInUser, product: product, inStock: false, id: signedInUserUID, money: parseInt(money) });
    });
  });
});

router.get('/doEditItem', function(req, res) {
    pg.connect(database, function (err, client, done) {
    if (err) {
      console.error('Could not connect to the database.');
      console.error(err);
      return;
    }
    
    var query = "UPDATE stock SET " +
        "uid = " + signedInUserUID + ", " +
        "label = '" + req.query.name + "', " +
        "price = " + req.query.price + ", " +
        "quantity = " + req.query.quantity + ", " +
        "description = '" + req.query.description + "', " +
        "url = '" + req.query.imageURL + 
        "' WHERE sid=" + req.query.sid + " " +
        "RETURNING sid;";

    client.query(query, function (error, result) {
      done();
      if (error) {
        console.error('Failed to execute query.');
        console.error(error);
        return;
      }

      client.query("SELECT * FROM stock WHERE sid=" + result.rows[0].sid, function (error, result) {
        done();
        if (error) {
          console.error('Failed to execute query.');
          console.error(error);
          return;
        }

        client.query("SELECT * FROM stock WHERE uid=" + signedInUserUID + ";", function (error, result) {
          done();
          if (error) {
            console.error('Failed to execute query.');
            console.error(error);
            return;
          }

          client.query("SELECT * FROM users WHERE uid=" + signedInUserUID + ";", function (error, result2) {
            done();
            if (error) {
              console.error('Failed to execute query.');
              console.error(error);
              return;
            }

            res.render('profile', {title: websiteName, signedInUser: signedInUser, list: result.rows, id: signedInUserUID, user: result2.rows[0], money: parseInt(money) });
          });
        });
      });
    });
  });
});

router.get('/doDeleteItem', function(req, res) {
  pg.connect(database, function (err, client, done) {
    if (err) {
      console.error('Could not connect to the database.');
      console.error(err);
      return;
    }

    client.query("DELETE FROM stock WHERE sid=" + req.query.sid + ";", function (error, result) {
      done();
      if (error) {
        console.error('Failed to execute query.');
        console.error(error);
        return;
      }

      client.query("SELECT * FROM stock WHERE uid=" + signedInUserUID + ";", function (error, result) {
        done();
        if (error) {
          console.error('Failed to execute query.');
          console.error(error);
          return;
        }

        client.query("SELECT * FROM users WHERE uid=" + signedInUserUID + ";", function (error, result2) {
          done();
          if (error) {
            console.error('Failed to execute query.');
            console.error(error);
            return;
          }

          res.render('profile', {title: websiteName, signedInUser: signedInUser, list: result.rows, id: signedInUserUID, user: result2.rows[0], money: parseInt(money) });
        });
      });
    });
  });
});

router.get('/deposit', function(req, res) {
  money = parseFloat(money, 10) +  parseFloat(req.query.amount, 10);
  pg.connect(database, function (err, client, done) {
    if (err) {
      console.error('Could not connect to the database.');
      console.error(err);
      return;
    }

    client.query("UPDATE users SET money=" + money + " WHERE uid=" + signedInUserUID + ";", function (error, result) {
      done();
      if (error) {
        console.error('Failed to execute query.');
        console.error(error);
        return;
      }

      res.render('userPage', { title: websiteName, signedInUser: signedInUser, realname: signedInUserRealname, message: "Deposited money successfully.", id: signedInUserUID, money: parseInt(money) });
    });
  });
});

router.get('/plusOne', function(req, res) {
  if (signedInUserUID == req.query.user) {
    res.render('index', { title: websiteName, signedInUser: signedInUser, message: "Cannot +1 yourself", id: signedInUserUID, money: parseInt(money) });
  }
  else {
    pg.connect(database, function (err, client, done) {
      if (err) {
        console.error('Could not connect to the database.');
        console.error(err);
        return;
      }

      client.query("SELECT * FROM users WHERE uid=" + req.query.user + ";", function (error, result) {
        done();
        if (error) {
          console.error('Failed to execute query.');
          console.error(error);
          return;
        }

        var rep = parseInt(result.rows[0].rep);

        client.query("UPDATE users SET rep=" + (rep + 1) + " WHERE uid=" + req.query.user + ";", function (error, result) {
          done();
          if (error) {
            console.error('Failed to execute query.');
            console.error(error);
            return;
          }

          res.render('index', {
            title: websiteName,
            signedInUser: signedInUser,
            message: "+1'd Seller",
            id: signedInUserUID,
            money: parseInt(money)
          });
        });
      });
    });
  }
});

router.get('/signUp', function(req, res) {
  res.render('signUp', { title: websiteName, message: "" });
});

router.get('/doSignUp', function(req, res) {
  if (req.query.password != req.query.confirmPassword) {
    res.render('signUp', { title: websiteName, message: "Passwords don't match." });
  }
  else if (req.query.username == "" || req.query.realname == "") {
    res.render('signUp', { title: websiteName, message: "Please full in all form entries." });
  }
  else {
    pg.connect(database, function (err, client, done) {
      if (err) {
        console.error('Could not connect to the database.');
        console.error(err);
        return;
      }

      var query = "INSERT INTO users (username, realname, password, rep, money) VALUES ('";
      query += req.query.username;
      query += "', '";
      query += req.query.realname;
      query += "', '";
      query += req.query.password;
      query += "', 0, 0);";

      client.query(query, function (error, result) {
        done();
        if (error) {
          console.error('Failed to execute query.');
          console.error(error);
          return;
        }

        res.render('index', { title: websiteName, signedInUser: signedInUser, message: "", id: signedInUserUID, money: parseInt(money) });
      });
    });
  }
});

module.exports = router;
