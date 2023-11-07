var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ejs = require('ejs');

var indexRouter = require('./routes/index');
var GUN = require('./routes/GUN');

var app = express();

app.use(
    session({
        cookie: { maxAge: 30000000000 },
        name: 'mySession',
        //store: new MongoStore({ url:Config.sys_mongo+"/foo" }),
        secret: 'keyboard cat',
        resave: true,
        saveUninitialized: true,
    })
);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', ejs.__express);
app.set('view engine', 'html');

var MongoClient = require('mongodb').MongoClient;
MongoClient.connect('mongodb://127.0.0.1:27017/Gunstash', function (err, database) {
    if (err) {
        console.log('MongoDB连接失败', err);
        throw err;
    }
    global.mongodb = database;
    global.ObjectID = require('mongodb').ObjectID;
    console.log('MongoDB连接成功');
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/GUN', GUN);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ejs = require('ejs');
var session = require('express-session');
