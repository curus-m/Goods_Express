const express = require('express');
const app = express();
const env = app.get('env');
const config = require('../config/config')
const moment = require('moment');
const thermometer = require('./ds18b20');
// const AWS = require('aws-sdk');
const { Pool } = require('pg')
const pool = new Pool(config[env].postgre);
const queries = require('../config/queries');
const logger = require('./logger');
module.exports = {
    addTemperature: async function() {
        let temp = thermometer.getTempData();
        let date = moment().format(config.dateString.temperature);
        const client = await pool.connect();
        const query = queries.createThermoData;
        const param = [date, temp, 0]
        try {
            const result = await client.query(query, param);
            // const data = result.rows[0];
            logger.debug(`[${date}] ${temp}℃`);
        } catch (error) {
            logger.error(error.stack);
        } finally {
            client.release()
        }
    }


}