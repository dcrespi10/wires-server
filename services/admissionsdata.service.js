var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('admissionsdata');
var ObjectId = require('mongodb').ObjectID;
var service = {};

service.getAdmissionsList = getAdmissionsList;
service.getAdmission = getAdmission;
service.create = create;
service.update = update;

module.exports = service;

function getAdmissionsList(userid) {
    var deferred = Q.defer();
    db.admissionsdata.find({userid: userid}, {IdentificativeNumber:1, Age:1, complete:1, hasErrors:1, module:1, deleted:1}).toArray(function (err, data) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        if (data) {
            deferred.resolve(data);
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
}

function getAdmission(userid, admissionid) {
    var deferred = Q.defer();
    db.admissionsdata.findOne({userid: userid, _id:ObjectId(admissionid)}, function (err, data) {
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
    db.admissionsdata.insert(
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
    db.admissionsdata.update(
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