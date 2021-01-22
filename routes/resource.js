var express = require('express');
var router = express.Router();
var resource = require('../bin/resource');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Resource' });
});
router.post('/getPreSign', resource.getPreSignedURL);
router.post('/getDakiThumbPreSign', resource.getPreSignedURL);
router.get('/material', resource.getMaterials);

module.exports = router;
