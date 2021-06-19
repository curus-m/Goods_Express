const express = require('express');
const router = express.Router();
const temperature = require('../bin/temperature')
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/getTemp', function(req, res, next) {
  next();
}, temperature.getTemp);
router.get('/getTempDatas', function(req, res, next) {
  next();
}, temperature.getTempDatas);

module.exports = router;
