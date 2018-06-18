var config = require('config.json');
var async = require('async');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('users');
const path = require('path');
var service = {};
var crypto = require('crypto');
service.authenticate = authenticate;
service.recover = recover;
service.restore = restore;
service.getAll = getAll;
service.getById = getById;
service.create = create;
service.update = update;
service.delete = _delete;
module.exports = service;

var  hbs = require('nodemailer-express-handlebars'),
email = process.env.MAILER_EMAIL_ID || ''
pass = process.env.MAILER_PASSWORD || ''
nodemailer = require('nodemailer');

var smtpTransport = nodemailer.createTransport({
  service: process.env.MAILER_SERVICE_PROVIDER || 'Gmail', // 'smtp.zoho.eu',
  auth: {
    user: email,
    pass: pass
  }
});
var handlebarsOptions = {
  viewEngine: 'handlebars',
  viewPath: path.resolve('./api/templates/'),
  extName: '.html'
};

smtpTransport.use('compile', hbs(handlebarsOptions));

function recover(address) {
    var deferred = Q.defer();
    async.waterfall([
    function(done) {
        db.users.findOne(
        
        { email: address }, function(err, user) {
        if (user) {
          
          done(err, user);
          
        } else {
          done('User not found.');
        }
      });
    },
    function(user, done) {
      // create the random token
      crypto.randomBytes(20, function(err, buffer) {
        var token = buffer.toString('hex');
        done(err, user, token);
      });
    },
    function(user, token, done) {
      user.reset_password_token = token;
      user.reset_password_expires = Date.now() + 86400000 
      db.users.update({ _id: mongo.helper.toObjectID(user._id) }, user, { upsert: true, new: true }, function(err, new_user) {
        done(err, token, user);
      });
    },
    function(token, user, done) {
      
      var data = {
        to: user.email,
        from: email,
        template: 'forgot-password-email',
        subject: 'Password help has arrived!',
        context: {
          url: 'http://localhost:4200/restore?token=' + token,
          name: user.firstName
        }
      };

      smtpTransport.sendMail(data, function(err) {
        if (!err) {
          deferred.resolve("A new password has been sent to the specified address.");                
        } else {
          deferred.reject(err.name + ': ' + err.message);
        }
      });
    }
  ], function(err) {
      console.log(err)
    deferred.reject(err.name + ': ' + err.message);
  });
  return deferred.promise;
};


function restore(req, res, next) {
    console.log(req.token)
    var deferred = Q.defer();
  db.users.findOne({
    reset_password_token: req.token,
    reset_password_expires: {
      $gt: Date.now()
    }
  }, function(err, user) {
    if (!err && user) {
      if (req.password === req.vpassword) {
        user.hash = bcrypt.hashSync(req.password, 10);
        user.reset_password_token = undefined;
        user.reset_password_expires = undefined;
        
        db.users.update({ _id: mongo.helper.toObjectID(user._id) }, user, { upsert: true, new: true }, function(err) {            
          if (err) {
            deferred.reject(err.name + ': ' + err.message);
            
          } else {
            var data = {
              to: user.email,
              from: email,
              template: 'reset-password-email',
              subject: 'Password Reset Confirmation',
              context: {
                name: user.firstName
              }
            };

            smtpTransport.sendMail(data, function(err) {
              if (!err) {
                deferred.resolve("Password resetted!");                
                
              } else {
                deferred.reject(err.name + ': ' + err.message);
              }
            });
          }
        });
      } else {
        deferred.reject("Password mismatch!");
      }
    } else {
      deferred.reject("Password reset token invalid or expired!");
    }
  });
  return deferred.promise;
};




function authenticate(username, password) {
    var deferred = Q.defer();

    db.users.findOne({ username: username }, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user && bcrypt.compareSync(password, user.hash)) {
            // authentication successful
            deferred.resolve({
                _id: user._id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                token: jwt.sign({ sub: user._id }, config.secret)
            });
        } else {
            // authentication failed
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function getAll() {
    var deferred = Q.defer();

    db.users.find().toArray(function (err, users) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        // return users (without hashed passwords)
        users = _.map(users, function (user) {
            return _.omit(user, 'hash');
        });

        deferred.resolve(users);
    });

    return deferred.promise;
}

function getById(_id) {
    var deferred = Q.defer();

    db.users.findById(_id, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user) {
            // return user (without hashed password)
            deferred.resolve(_.omit(user, 'hash'));
        } else {
            // user not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function create(userParam) {
    var deferred = Q.defer();

    // validation
    db.users.findOne(
        { username: userParam.username },
        function (err, user) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            if (user) {
                // username already exists
                deferred.reject('Username "' + userParam.username + '" is already taken');
            } else {
                
                db.users.findOne(
                { email: userParam.email },
                function (err, user) {
                    if (err) deferred.reject(err.name + ': ' + err.message);

                    if (user) {
                        // username already exists
                        deferred.reject('Email address is already in use');
                    } else {
                        createUser();
                    }
                });
                //createUser();
            }
        });

    function createUser() {
        // set user object to userParam without the cleartext password
        var user = _.omit(userParam, 'password');

        // add hashed password to user object
        user.hash = bcrypt.hashSync(userParam.password, 10);

        db.users.insert(
            user,
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function update(_id, userParam) {
    var deferred = Q.defer();

    // validation
    db.users.findById(_id, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user.username !== userParam.username) {
            // username has changed so check if the new username is already taken
            db.users.findOne(
                { username: userParam.username },
                function (err, user) {
                    if (err) deferred.reject(err.name + ': ' + err.message);

                    if (user) {
                        // username already exists
                        deferred.reject('Username "' + req.body.username + '" is already taken')
                    } else {
                        updateUser();
                    }
                });
        } else {
            updateUser();
        }
    });

    function updateUser() {
        // fields to update
        var set = {
            firstName: userParam.firstName,
            lastName: userParam.lastName,
            username: userParam.username,
        };

        // update password if it was entered
        if (userParam.password) {
            set.hash = bcrypt.hashSync(userParam.password, 10);
        }

        db.users.update(
            { _id: mongo.helper.toObjectID(_id) },
            { $set: set },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function _delete(_id) {
    var deferred = Q.defer();

    db.users.remove(
        { _id: mongo.helper.toObjectID(_id) },
        function (err) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            deferred.resolve();
        });

    return deferred.promise;
}