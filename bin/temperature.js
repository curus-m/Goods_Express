const express = require('express');
const app = express();
const env = app.get('env');
const config = require('../config/config')
const moment = require('moment');
const dht11 = require('./dht11');
const { Pool } = require('pg')
const pool = new Pool(config[env].postgre);
const queries = require('../config/queries');
const logger = require('../config/logger');
module.exports = {
  addTempData: async function() {
    let tempData = await dht11.getTemperature();
    // logger.debug(tempData);
    let date = moment().format(config.dateString.temperature);
    const client = await pool.connect();
    const query = queries.createTemperatureData;
    const param = [date, tempData.temperature, tempData.humidity]
    try {
        const result = await client.query(query, param);
        // const data = result.rows[0];
        logger.debug(`[${date}] ${tempData.temperature}℃, ${tempData.humidity}%`);
    } catch (error) {
        logger.error(error.stack);
    } finally {
        client.release()
    }
  },
  getTempData: function(req, res, next) {
    // logger.log("info", `Now temperature is ${temp}℃`);
    (async () => {
      let date = moment().format(config.dateString.temperature);
      let temp = await dht11.getTemperature();
      // logger.debug("tempData: " +temp);
      const tempData = {
          "time": date,
          "temperature": temp.temperature,
          "humidity": temp.humidity
      }
      res.json(tempData);
    })().catch(next)
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
