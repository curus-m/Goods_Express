const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('./config/logger')
const indexRouter = require('./routes/index');
const dakimakuraRouter = require('./routes/dakimakura');
const resourceRouter = require('./routes/resource');
const cors = require('cors');
const app = express();
const config = require('./config/config');
const env = app.get('env');

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
// app.options('/getTemp', cors());


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

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
module.exports = app;
