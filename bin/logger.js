const express = require('express');
const app = express();
const env = app.get('env');
const winston = require('winston');
const { format } = require('winston');
const config = require("../config/config");
const date = new Date();
let yyyy = date.getFullYear();
let mm = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1); // getMonth() is zero-based
let dd  = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
const dateLog= "".concat(yyyy).concat(mm).concat(dd).concat(".log");


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
    new winston.transports.Console(),
    new winston.transports.File({ filename: config[env].logFilePath+"error.log", level: 'error' }),
    new winston.transports.File({ filename: config[env].logFilePath+dateLog }),
  ],
});