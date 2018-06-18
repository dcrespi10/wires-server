var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('crfsdefinitions');
var ObjectId = require('mongodb').ObjectID;

var service = {};
var mockedCrf = ["wires", "infections", "openabdomen"]
service.getcrf = getcrf;
service.getCrfsList = getCrfsList;
service.update = update;

module.exports = service;

function getcrf(crfname) {
    var deferred = Q.defer();
    if (mockedCrf.indexOf(crfname) > -1)
        crfname = "AdmissionsData";
    db.crfsdefinitions.findOne({ name: crfname }, function (err, crf) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (crf) {
            // authentication successful
            deferred.resolve(crf);
        } else {
            // authentication failed
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function getCrfsList() {
    var deferred = Q.defer();
    db.crfsdefinitions.find({}, {name:1}).toArray(function (err, data) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        if (data) {
            deferred.resolve(data);
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
}

function update(newdata) {
    var deferred = Q.defer();
    crfid = newdata._id;
    delete newdata._id
    db.crfsdefinitions.update(
        { _id:ObjectId(crfid)},
        newdata,
        function (err, doc) {
            if (err) deferred.reject(err.name + ': ' + err.message);
            
            deferred.resolve();
    });
    return deferred.promise;
}