var express = require('express');
var router = express.Router();
var dakimakura = require('../bin/dakimakura');
var multer  = require('multer');
var config = require('../config/config');
var app = express();
var env = app.get('env');
const moment = require('moment');
var storageSetting = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config[env].resourcePath+"dakimakura/")
  },
  filename: function (req, file, cb) {
    let splits = file.originalname.split(".");
    const extensionName = splits[splits.length-1];
    let fileName = moment().format(config.dateString.resource).concat(".")+extensionName;
    cb(null, fileName);
  }
})
let upload = multer({ storage: storageSetting })
/* GET home page. */
router.get('/', function(req, res, next) {
    console.log(`${req.originalUrl} / ${req.method}`);
    // console.log('Request Type:', req.method);
    next();
}, dakimakura.getList);

router.get('/:id', function (req, res, next) {
    // if the user ID is 0, skip to the next router
    if (req.params.id == 0) next('route');
    // otherwise pass control to the next middleware function in this stack
    else next(); //
  }, dakimakura.getItem);

router.delete('/:id', dakimakura.delete);
router.post('/', upload.single('file'), dakimakura.create);
router.put('/:id', upload.single('file'), dakimakura.update);
module.exports = router;
