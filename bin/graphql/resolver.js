const express = require('express');
const app = express();
const env = app.get('env');
const { Pool } = require('pg')
const config = require('../../config/config')
const pool = new Pool(config[env].postgre);
const queries = require('../../config/queries');
const dht11 = require('../dht11');
const temperature = require('../temperature');
const moment = require('moment');
module.exports = { 
    tempData : async () => {
        let tempData = await dht11.getTemperature();
        tempData["time"] = moment().format(config.dateString.temperature);
        return tempData;
    },
    tempDatas : async () => {
        const client = await pool.connect();
        const query = queries.getTemperatureDatas;
        try {
            const result = await client.query(query);
            return result.rows;
        } catch (error) {
            logger.error(error.stack);
        } finally {
            client.release()
        }       
  }
}