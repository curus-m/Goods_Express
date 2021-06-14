const config = require('../config/config')
const fileName = `${config.production.tempDevicePath}${config.production.tempDeviceName}${config.production.tempFileName}`;
const fs = require('fs')
const logger = require('./logger');

module.exports = {
    getTempData: function() {
        fs.readFile(fileName, 'utf8' , (err, data) => {
            if (err) {
              logger.error("Error Occured in Temperature");
              logger.error(err);
              return;
            }
            let temp = data.slice(69).trim()*0.001;
            return temp;
          })
    }
}