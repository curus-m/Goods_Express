var express = require('express');
var router = express.Router();
var dakimakura = require('../apps/dakimakura');

/* GET home page. */
router.get('/', function(req, res, next) {
    console.log('LOGGED');
    // console.log('Request Type:', req.method);
    next();
}, dakimakura.getList);

router.get('/:id', function (req, res, next) {
    // if the user ID is 0, skip to the next router
    if (req.params.id == 0) next('route');
    // otherwise pass control to the next middleware function in this stack
    else next(); //
  }, dakimakura.getItem);
  
module.exports = router;
