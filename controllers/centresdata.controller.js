var config = require('config.json');
var express = require('express');
var router = express.Router();
var centresDataService = require('services/centresdata.service');

// routes
router.post('/create', create);
router.get('/:userid', get);
router.get('/:userid/:centresdataid', getOne);
router.post('/update', update);

module.exports = router;

function create(req, res) {
    centresDataService.create(req.body)
        .then(function () {
            res.json('success');
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function get(req, res) {
    centresDataService.getCentresDataList(req.params.userid)
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
    centresDataService.getCentresData(req.params.userid, req.params.centresdataid)
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
    centresDataService.update(req.body)
        .then(function () {
            res.json('success');
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}