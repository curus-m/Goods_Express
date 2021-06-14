// cat /sys/bus/w1/devices/28-01205b9734b5/w1_slave
// output:
// 99 01 4b 46 7f ff 0c 10 5a : crc=5a YES
// 99 01 4b 46 7f ff 0c 10 5a t=25562
const config = require('../config/config')
const moment = require('moment');
const thermometer = require('./ds18b20');
module.exports = {
  getTemp: function(req, res, next) {
    // logger.log("info", `Now temperature is ${temp}℃`);
    const temp = thermometer.getTempData();
    let date = moment().format(config.dateString.temperature);
    // console.log(date + ": "+temp);
    const tempData = {
        "time": date,
        "temp": temp
    }
    res.json(tempData);
  }
}
