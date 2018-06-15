var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('news');
var ObjectId = require('mongodb').ObjectID;
var service = {};

service.getNewsList = getNewsList;
//service.getAdmission = getAdmission;
service.create = create;
service.update = update;

module.exports = service;

function getNewsList(userid) {
    date = new Date();
    year = date.getFullYear();
    month = date.getMonth()+1;
    dt = date.getDate();

    if (dt < 10) {
      dt = '0' + dt;
    }
    if (month < 10) {
      month = '0' + month;
    }
    var todayString = year+'-' + month + '-'+dt; 
    var deferred = Q.defer();
    db.news.find({userid: userid, expiryDate:{$gte:todayString}, date:{$lte:todayString}}).toArray(function (err, data) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        if (data) {
            deferred.resolve(data);
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
}

/*function getAdmission(userid, admissionid) {
    var deferred = Q.defer();
    db.news.findOne({userid: userid, _id:ObjectId(admissionid)}, function (err, data) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (data) {
            deferred.resolve(data);
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
}*/

function create(data) {
    var deferred = Q.defer();
    db.news.insert(
        data,
        function (err, doc) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            deferred.resolve();
        });
    return deferred.promise;
}

function update(newdata) {
    var deferred = Q.defer();
    userid = newdata.userid;
    admissionid = newdata._id;
    delete newdata._id
    db.news.update(
        {userid:userid, _id:ObjectId(admissionid)},
        newdata,
        function (err, doc) {
            if (err) deferred.reject(err.name + ': ' + err.message);
            
            deferred.resolve();
    });
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