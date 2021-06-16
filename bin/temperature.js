// cat /sys/bus/w1/devices/28-01205b9734b5/w1_slave
// output:
// 99 01 4b 46 7f ff 0c 10 5a : crc=5a YES
// 99 01 4b 46 7f ff 0c 10 5a t=25562
const express = require('express');
const app = express();
const env = app.get('env');
const config = require('../config/config')
const moment = require('moment');
const thermometer = require('./ds18b20');
const { Pool } = require('pg')
const pool = new Pool(config[env].postgre);
const queries = require('../config/queries');
module.exports = {
  getTemp: function(req, res, next) {
    // logger.log("info", `Now temperature is ${temp}℃`);
    let date = moment().format(config.dateString.temperature);
    let temp = thermometer.getTempData();
    const tempData = {
        "time": date,
        "temp": temp
    }
    // console.log(date + ": "+temp);
    res.json(tempData);
  },
  getTempDatas : async function(req, res, next) {
    const client = await pool.connect();
    const query = queries.getTemperatureDatas;
    // const param = [date, temp, 0]
    try {
        const result = await client.query(query);
        res.json(result.rows);
    } catch (error) {
        logger.error(error.stack);
    } finally {
        client.release()
    }
  }
}
