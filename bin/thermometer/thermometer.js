const express = require('express');
const app = express();
const env = app.get('env');
const config = require('../../config/config')
const moment = require('moment');
const thermometer = require('./dht11');
// const AWS = require('aws-sdk');
const { Pool } = require('pg')
const pool = new Pool(config[env].postgre);
const queries = require('../../config/queries');
const logger = require('../../config/logger');
module.exports = {
    addTemperature: async function() {
        let tempData = await thermometer.getTemperature();
        logger.debug(tempData);
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
    }


}