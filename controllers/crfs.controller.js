var config = require('config.json');
var express = require('express');
var router = express.Router();
var crfService = require('services/crf.service');

// routes
router.post('/getcrf', getcrf);
router.get('/getCrfsList', getCrfsList);
router.post('/update', update);
module.exports = router;

function getCrfsList(req, res){
    crfService.getCrfsList()
        .then(function (crf) {
            if (crf) {
                // authentication successful
                res.send(crf);
            } else {
                // authentication failed
                res.status(400).send('Crf list not available');
            }
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function getcrf(req, res) {
    crfService.getcrf(req.body.name)
        .then(function (crf) {
            if (crf) {
                // authentication successful
                res.send(crf);
            } else {
                // authentication failed
                res.status(400).send('Crf not found');
            }
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function update(req, res) {
    crfService.update(req.body)
        .then(function () {
            res.json('success');
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}
