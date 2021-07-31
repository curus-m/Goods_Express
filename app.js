const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('./config/logger')
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const dakimakuraRouter = require('./routes/dakimakura');
const resourceRouter = require('./routes/resource');
const cors = require('cors');
const app = express();
const config = require('./config/config');
const env = app.get('env');
const schedule = require('node-schedule');
const temperature = require('./bin/temperature');
const moment = require('moment');
const { graphqlHTTP } = require('express-graphql');
const graphqlSchema = require('./bin/graphql/schema');
const graphqlResolver = require('./bin/graphql/resolver');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//for local use
app.use('/images', express.static(config[env].resourcePath));
app.use('/thumbnails', express.static(config[env].thumbnailPath));
app.use('/', indexRouter);
app.use('/dakimakura', dakimakuraRouter);
app.options('/dakimakura', cors());
app.use('/resource', resourceRouter);
app.use('/users', usersRouter);
app.options('/getTemp', cors());



// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

logger.info(`App Initialized! : ${env} mode`);

// set temperature check
const addTemperatureJob = schedule.scheduleJob("0 */20 * * * *", async function () {
  if(env == "production") {
    temperature.addTempData();
  } else {
    logger.info("thermometer check skipped on"+ moment().format(config.dateString.temperature));
  }
});

const addWeatherJob = schedule.scheduleJob("0 0 * * * *", async function () {
  if(env == "production") {
    temperature.addWeatherData();
  } else {
    logger.info("weather check skipped on"+ moment().format(config.dateString.temperature));
  }
}); 

//setup graphQL
app.use(
  '/temperature',
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: env === 'development'
  }),
);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
module.exports = app;
