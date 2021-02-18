var express = require('express');
var router = express.Router();
var dakimakura = require('../bin/dakimakura');
var multer  = require('multer');
var config = require('../config/config');
var storageSetting = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.resourcePath+"dakimakura/")
  },
  filename: function (req, file, cb) {
    let splits = file.originalname.split(".");
    const extensionName = splits[splits.length-1];
    const date = new Date();  
    let yyyy = date.getFullYear();
    let mm = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1); // getMonth() is zero-based
    let dd  = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    let hh = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
    let min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    let ss = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    let fileName = "".concat(yyyy).concat(mm).concat(dd).concat(hh).concat(min).concat(ss)+"."+extensionName;
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
