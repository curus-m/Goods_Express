var express = require('express');
var router = express.Router();
var resources = require('../bin/resources');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/getPreSign', resources.getPreSignedURL);
router.get('/material', resources.getMaterials);

module.exports = router;
