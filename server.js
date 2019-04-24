const express = require('express');
const path = require('path');
const openAPIinitialize = require('express-openapi').initialize;
const swaggerUi = require('swagger-ui-express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const winston = require('winston');
const expressWinston = require('express-winston');
const flash = require('connect-flash');

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportAuthSetup = require('./routes/authSetup');
const routeInstaller = require('./routes/wifiologyRoutes');


const { createPostgresPool, doMigrationUpSync } = require('./db/core');

const apiDoc = require('./api/api-doc').apiDoc;

const testThingService = require('./api/services/testThingService').testThingService;
const usersServiceConstructor = require('./api/services/usersService');
const apiKeysServiceConstructor = require('./api/services/apiKeysService');
const nodesServiceConstructor = require('./api/services/nodesService');
const measurementsServiceConstructor = require('./api/services/measurementsService');
const securityAuthHandlerConstructor = require('./api/securityHandler');
const { FeatureFlags } = require('./db/data/featureFlags');

const PORT = process.env.PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres@127.0.0.1/wifiology";
let AUTOMIGRATE;
if(process.env.AUTOMIGRATE){
    AUTOMIGRATE = process.env.AUTOMIGRATE === 'true';
} else {
    AUTOMIGRATE = true;
}
let DATABASE_USE_SSL;
if(process.env.DATABASE_USE_SSL){
    DATABASE_USE_SSL = process.env.DATABASE_USE_SSL === 'true'
} else {
    DATABASE_USE_SSL = true;
}


function createApplication(databaseUrl, autoMigrate, useSSL){
    let application = express();
    if(autoMigrate){
        doMigrationUpSync(databaseUrl);
    }

    let pool = createPostgresPool(databaseUrl, useSSL);
    let featureFlags = new FeatureFlags(pool);

    application.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));
    application.use(bodyParser.json({ limit: '100mb'}));
    application.use(cookieParser());


    application.use(expressWinston.logger({
        transports: [
            new winston.transports.Console()
        ],
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
        meta: true, // optional: control whether you want to log the meta data about the request (default to true)
        msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
        expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
        colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
        ignoreRoute: function (req, res) { return false; } // optional: allows to skip some log messages based on request and/or response
    }));

    application
        .use(express.static(path.join(__dirname, 'public')))
        .set('views', path.join(__dirname, 'views'))
        .set('view engine', 'ejs')
        .get('/db', async  (req, res) => {
            try {
                const client = await pool.connect();
                const result = await client.query('SELECT * FROM test_table');
                const results = { 'results': (result) ? result.rows : null};
                res.render('pages/db', results );
                client.release();
            } catch (err) {
                console.error(err);
                res.send("Error " + err);
            }
        });

    application.use(
        '/api/1.0/ui',
        swaggerUi.serve,
        swaggerUi.setup(null, {swaggerUrl: '/api/1.0/api-docs'})
    );

    passportAuthSetup(passport, pool, featureFlags);

    application.use(session({secret: process.env.SECRET || 'qov8yHA3grUJ1PjWdntx'}));
    application.use(flash());
    application.use(passport.initialize());
    application.use(passport.session());
    
    routeInstaller(application, passport, pool);

    openAPIinitialize({
        app: application,
        apiDoc: apiDoc,
        dependencies: {
            testThingService,
            usersService: usersServiceConstructor(pool),
            apiKeysService: apiKeysServiceConstructor(pool),
            nodesService: nodesServiceConstructor(pool),
            measurementsService: measurementsServiceConstructor(pool),
            featureFlags: featureFlags
        },
        securityHandlers: securityAuthHandlerConstructor(pool),
        paths: path.resolve(__dirname, 'api/paths'),
        promiseMode: true
    });



    application.use(function(err, req, res, next) {
        if(req.path.startsWith("/api/1.0")){
            res.status(err.status || 400).json({error: err, message: err.toString(), traceback: err.stack});
        }
        else {
            next(err);
        }
    });

    return application;
}

if (require.main === module) {
    winston.add(new winston.transports.Console({
        format: winston.format.simple(),
        timestamp: true
    }));

    application = createApplication(DATABASE_URL, AUTOMIGRATE, DATABASE_USE_SSL)
        .listen(PORT, () => console.log(`Listening on ${ PORT }`));
}


module.exports = {
    createApplication
};

