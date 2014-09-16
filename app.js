'use strict';

//dependencies
var express = require('express'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    mongoStore = require('connect-mongo')(session),
    http = require('http'),
    path = require('path'),
    passport = require('passport'),
    mongoose = require('mongoose'),
    helmet = require('helmet'),
    multiViews = require('multi-views'),
    urlize = require('nurlize'),
    csrf = require('csurf');

function create (config) {

  //create express app
  var app = express();

  //keep reference to config
  app.config = config;


  //setup mongoose
  app.db = mongoose.createConnection(config.mongodb.uri);
  app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
  app.db.once('open', function () {
    //and... we have a data store
  });

  //config data models
  require('./models')(app, mongoose);

  //settings
  app.disable('x-powered-by');
  app.set('port', config.port);
  multiViews.setupMultiViews(app);
  app.set('views', [ path.join(__dirname, 'views')
         ].concat((config.extra_views || [ ]).map(path.resolve)));
  app.set('view engine', 'jade');

  //middleware
  app.use(function (req, res, next) {
    req.urlize = urlize(req.protocol + "://" + req.get('host') + req.originalUrl);
    next( );
  });
  app.use(require('morgan')('dev'));
  app.use(require('compression')());
  app.use(require('serve-static')(path.join(__dirname, 'public')));
  app.use(require('method-override')());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser(config.cryptoKey));
  app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: config.cryptoKey,
    store: new mongoStore({ url: config.mongodb.uri })
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(csrf({ cookie: { signed: true } }));
  helmet(app);

  //response locals
  app.use(function(req, res, next) {
    res.cookie('_csrfToken', req.csrfToken());
    res.locals.urlize = req.urlize.urlize;
    res.locals.links = {
      base: req.urlize.urlize('/').urlize(config.http_path_prefix || '')
    };
    res.locals.user = {};
    res.locals.user.defaultReturnUrl = req.user && req.user.defaultReturnUrl();
    res.locals.user.username = req.user && req.user.username;
    if (req.user && req.user.roles) {
      res.locals.user = req.user;
    }
    next();
  });

  //global locals
  app.locals.projectName = app.config.projectName;
  app.locals.copyrightYear = new Date().getFullYear();
  app.locals.copyrightName = app.config.companyName;
  app.locals.cacheBreaker = app.config.cacheBreaker || 'br34k-01';

  //setup passport
  require('./passport')(app, passport);

  //setup routes
  require('./routes')(app, passport);

  //custom (friendly) error handler
  app.use(require('./views/http/index').http500);

  //setup utilities
  app.utility = require('./util/');
  return app;
}

module.exports = create;

if (!module.parent) {
  var config = require('./config');

  var app = create(config);
  //setup the web server
  app.server = http.createServer(app);

  //listen up
  app.server.listen(app.config.port, function(){
    //and... we're live
  });
}
