const {spawnClientFromPool, commit, rollback} = require('../db/core');
const { getAllUsers, getUserByID } = require('../db/data/wifiologyUser');


function routesConstructor(app, passport, dbPool){
    async function indexGetHandler(req, res){
        res.render('pages/index');
    }

    async function loginGetHandler(req, res){
        res.render('pages/login');
    }

    async function usersGetHandler(req, res){
        let client = await spawnClientFromPool(dbPool);
        try{
              let users = await getAllUsers(client, 1000,0);
              res.render('pages/users', {users: users});
        }
        finally {
            client.release();
        }
        
    }

    async function userGetHandler(req, res){
        let client = await spawnClientFromPool(dbPool);
        try{
              let user = await getUserByID(client, parseInt(req.params.userID));
              res.render('pages/user', {user: user});
        }
        finally {
            client.release();
        }
        
    }

    async function nodesGetHandler(req, res){
        let client = await spawnClientFromPool(dbPool);
        try{
              res.render('pages/nodes');
        }
        finally {
            client.release();
        }
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
    app.get('/users', usersGetHandler);
    app.get('/users/:userID',userGetHandler);
    app.post('/login', passport.authenticate('local', {failureRedirect: '/login'}), loginPostHandler);
    app.post('/register', registrationPostHandler);
    app.get('/nodes', nodesGetHandler);
}

module.exports = routesConstructor;
