var config = require('config.json');
var express = require('express');
var router = express.Router();
var crfService = require('services/crf.service');

// routes
router.post('/getcrf', getcrf);
module.exports = router;

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
