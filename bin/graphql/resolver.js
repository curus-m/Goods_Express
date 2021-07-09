const express = require('express');
const app = express();
const env = app.get('env');
const { Pool } = require('pg')
const config = require('../../config/config')
const pool = new Pool(config[env].postgre);
const queries = require('../../config/queries');
const dht11 = require('../dht11');
// const temperature = require('../temperature');
const moment = require('moment');
const logger = require('../../config/logger');
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
            const data = await client.query(query);
            return data.rows;
        } catch (error) {
            logger.error(error.stack);
        } finally {
            client.release()
        }       
    },
    tempMaxMins : async() => {
        const client = await pool.connect();
        const query = queries.getTemperatureMaxMins;
        const before = moment().add(-8, 'd').format(config.dateString.postgreSearchQuery)
        const yesterday = moment().add(-1, 'd').format(config.dateString.postgreSearchQuery);
        const param = [before, yesterday]
        try {
            const data = await client.query(query, param);
            return data.rows;
        } catch (error) {
            logger.error(error.stack);
        } finally {
            client.release();
        }
    }
}