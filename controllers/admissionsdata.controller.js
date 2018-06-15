var config = require('config.json');
var express = require('express');
var router = express.Router();
var admissionsDataService = require('services/admissionsdata.service');

// routes
router.post('/create', create);
router.get('/:userid', get);
router.get('/:userid/:admissionid', getOne);
router.post('/update', update);

module.exports = router;

function create(req, res) {
    admissionsDataService.create(req.body)
        .then(function () {
            res.json('success');
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function get(req, res) {
    admissionsDataService.getAdmissionsList(req.params.userid)
        .then(function (data) {
            if (data) {
                res.send(data);
            } else {
                res.sendStatus(404);
            }
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function getOne(req, res) {
    admissionsDataService.getAdmission(req.params.userid, req.params.admissionid)
        .then(function (data) {
            if (data) {
                res.send(data);
            } else {
                res.sendStatus(404);
            }
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function update(req, res) {
    admissionsDataService.update(req.body)
        .then(function () {
            res.json('success');
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}