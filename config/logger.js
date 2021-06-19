const express = require('express');
const app = express();
const env = app.get('env');
const winston = require('winston');
const { format } = require('winston');
const config = require("./config");
const moment = require('moment');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const logger = module.exports = winston.createLogger({
    format: combine(
        timestamp(),
        myFormat
    ),    
    level: 'debug',
    defaultMeta: { service: 'user-service' },
    transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
    new winston.transports.Console({level : "debug"}),
    new winston.transports.File({ filename: config[env].logFilePath+"error.log", level: 'error' }),
    new winston.transports.File({ filename: config[env].logFilePath+moment().format(config.dateString.log).concat('.log'), level: 'debug' }),
  ],
});