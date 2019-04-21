function routesConstructor(app, passport, dbPool){
    async function indexGetHandler(req, res){
        if(req.user){
            res.render(
                'pages/index',
                {
                    user: req.user,
                    messages: req.flash()
                }
            );
        }
        else {
            res.redirect("/login");
        }

    }

    async function loginGetHandler(req, res){
        if(!req.user){
            res.render(
                'pages/login',
                {
                    messages: req.flash()
                }
            );
        } else {
            res.redirect('/');
        }

    }

    async function logoutGetHandler(req, res){
        if(req.user){
            req.logout();
            req.flash('success', 'Logged out successfully.');
        }
        res.redirect('/login');
    }

    async function registrationGetHandler(req, res){
        if(!req.user){
            res.render(
                'pages/register',
                {
                    messages: req.flash()
                }
            );
        } else {
            res.redirect('/');
        }
    }


    async function loginPostHandler(req, res){
        req.flash('success', `Logged in as ${req.user.userName}`);
        res.redirect('/');
    }

    async function registrationPostHandler(req, res){
        req.flash('success', `Registered as ${req.user.userName}`);
        res.redirect('/');
    }

    app.get('/', indexGetHandler);
    app.get('/login', loginGetHandler);
    app.get('/logout', logoutGetHandler);
    app.get('/register', registrationGetHandler);

    app.post('/login',
        passport.authenticate(
            'local-login',
            {failureRedirect: '/login', failureFlash: true}
        ),
        loginPostHandler
    );
    app.post('/register',
        passport.authenticate(
            'local-register',
            {failureRedirect: '/register', failureFlash: true}
        ),
        registrationPostHandler
    );
}

module.exports = routesConstructor;
