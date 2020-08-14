var express = require('express');
var router = express.Router();
var dakimakura = require('../apps/dakimakura');

/* GET home page. */
router.get('/', function(req, res, next) {
    console.log('LOGGED');
    // console.log('Request Type:', req.method);
    next();
}, dakimakura.getList);

module.exports = router;
