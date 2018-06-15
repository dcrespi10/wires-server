var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('crfsdefinitions');

var service = {};
var mockedCrf = ["wires", "infections", "openabdomen"]
service.getcrf = getcrf;

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