const logger = require('../../config/logger');
const fs = require('fs');
const config = require('../../config/config');

module.exports = {
  getTemperature: function() {
    return new Promise(function(resolve, reject) {
      fs.readFile(config.production.tempFileName, 'utf8' , (err, data) => {
        if (err) {
          logger.error(err);
          reject(err);
        }
        // logger.debug(data);
        resolve(JSON.parse(data));
      })
      
    });
  }
}