const config = require('../config/config')
const fileName = `${config.production.tempDevicePath}${config.production.tempDeviceName}${config.production.tempFileName}`;
const fs = require('fs')
const logger = require('./logger');

module.exports = {
    getTempData: function() {
        let data = fs.readFileSync(fileName,'utf-8');
        let temp = data.slice(69).trim()*0.001;
        return temp;
    }
}