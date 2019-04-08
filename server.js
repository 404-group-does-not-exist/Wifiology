const express = require('express');
const path = require('path');
const pg = require('pg');


const PORT = process.env.PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres@127.0.0.1/wifiology";



function createApplication(pg_conn_str){
    let application = express();
    let pool = new pg.Pool({
       connectionString: pg_conn_str,
       ssl: true
    });

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
        //.get('/foobar',foobar_routes.foobar)

    return application;
}

application = createApplication(DATABASE_URL).listen(PORT, () => console.log(`Listening on ${ PORT }`));
