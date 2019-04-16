const express = require('express');
const path = require('path');
const pg = require('pg');
const openAPIinitialize = require('express-openapi').initialize;
const swaggerUi = require('swagger-ui-express');
const bodyParser = require('body-parser');
const winston = require('winston');
const expressWinston = require('express-winston');


const { createPostgresPool } = require('./db/core');

const apiDoc = require('./api/api-doc').apiDoc;

const testThingService = require('./api/services/testThingService').testThingService;
const usersServiceConstructor = require('./api/services/usersService');
const apiKeysServiceConstructor = require('./api/services/apiKeysService');
const nodesServiceConstructor = require('./api/services/nodesService');
const measurementsServiceConstructor = require('./api/services/measurementsService');
const securityAuthHandlerConstructor = require('./api/securityHandler');

const PORT = process.env.PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres@127.0.0.1/wifiology";


function createApplication(pg_conn_str){
    let application = express();
    let pool = createPostgresPool(pg_conn_str, true);

    application
        .use(express.static(path.join(__dirname, 'public')))
        .set('views', path.join(__dirname, 'views'))
        .set('view engine', 'ejs')
        .get('/', (req, res) => res.render('pages/index'))
        .get('/db', async (req, res) => {
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

    application.use(bodyParser.urlencoded({ extended: true }));
    application.use(bodyParser.json());

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

    openAPIinitialize({
        app: application,
        apiDoc: apiDoc,
        dependencies: {
            testThingService,
            usersService: usersServiceConstructor(pool),
            apiKeysService: apiKeysServiceConstructor(pool),
            nodesService: nodesServiceConstructor(pool),
            measurementsService: measurementsServiceConstructor(pool)
        },
        securityHandlers: securityAuthHandlerConstructor(pool),
        paths: './api/paths',
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


winston.add(new winston.transports.Console({
    format: winston.format.simple()
}));


application = createApplication(DATABASE_URL).listen(PORT, () => console.log(`Listening on ${ PORT }`));
