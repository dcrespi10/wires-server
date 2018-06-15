var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('centresdata');
var ObjectId = require('mongodb').ObjectID;
var service = {};

service.getCentresDataList = getCentresDataList;
service.getCentresData = getCentresData;
service.create = create;
service.update = update;

module.exports = service;

function getCentresDataList(userid) {
    var deferred = Q.defer();
    db.centresdata.find({userid: userid}, {start:1, end:1, complete:1, hasErrors:1}).toArray(function (err, data) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        if (data) {
            deferred.resolve(data);
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
}

function getCentresData(userid, centresdataid) {
    var deferred = Q.defer();
    db.centresdata.findOne({userid: userid, _id:ObjectId(centresdataid)}, function (err, data) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        
        if (data) {
            deferred.resolve(data);
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
}

function create(data) {
    var deferred = Q.defer();
    db.centresdata.insert(
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
    centresdataid = newdata._id;
    delete newdata._id
    db.centresdata.update(
        {userid:userid, _id:ObjectId(centresdataid)},
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