function routesConstructor(app, passport, dbPool){
    async function indexGetHandler(req, res){
        res.render('pages/index');
    }

    async function loginGetHandler(req, res){
        res.render('pages/login');
    }

    async function loginPostHandler(req, res){
        res.redirect('/');
    }

    async function registrationGetHandler(req, res){
        res.render('pages/register');
    }

    async function registrationPostHandler(req, res){
        
    }

    app.get('/', indexGetHandler);
    app.get('/login', loginGetHandler);
    app.get('/register', registrationGetHandler);
    app.post('/login', passport.authenticate('local', {failureRedirect: '/login'}), loginPostHandler);
    app.post('/register', registrationPostHandler);
}

module.exports = routesConstructor;
