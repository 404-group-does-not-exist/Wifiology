const { getUserByUserName, getUserByID, getUserByEmailAddress, createNewUser } = require('../db/data/wifiologyUser');
const { transactionWrapper, connectionWrapper } = require('../db/core');
const LocalStrategy = require('passport-local').Strategy;


function authSetup(passport, dbPool, featureFlags){
    passport.serializeUser( function(user, done){
        done(null, user.userID);
    });

    passport.deserializeUser(async function(userID, done){
        return await transactionWrapper(dbPool, async function(client){
            let user = await getUserByID(client, userID);
            if(!user){
                return done(null, false, {message: "No such user or invalid password."});
            }
            else if(!user.isActive){
                return done(null, false, {message: "User has not yet been activated."});
            }
            else {
                return done(null, user);
            }
        });
    });

    async function handleAuth(username, password, done){
        return await transactionWrapper(dbPool, async function(client) {
            let user = await getUserByUserName(client, username);
            if(!user){
                return done(null, false, {message: "No such user or invalid password."});
            }
            else if(!user.verifyPassword(password)) {
                return done(null, false, {message: "No such user or invalid password."});

            }
            else if(!user.isActive){
                return done(null, false, {message: "User has not yet been activated."});
            }
            else {
                return done(null, user);
            }
        });
    }

    async function handleRegister(req, username, password, done){
        let emailAddress = req.body.emailAddress;
        return await transactionWrapper(dbPool, async function(client){
            let userSignupAllowed = await featureFlags.getFlag("users/allowUserSignup", client, true);

            if(!userSignupAllowed){
                return done(null, false, {message: `User registration currently disallowed on this system.`});
            }

            let user = await getUserByUserName(client, username);
            let userAgain = await getUserByEmailAddress(client, emailAddress);
            if(user){
                return done(null, false, {message: `User with username: '${username}' already exists.`});
            }
            else if(userAgain){
                return done(null, false, {message: `User with email address: '${emailAddress}' already exists.`});
            }
            else {
                let isActive = await featureFlags.getFlag("users/autoActivate", client, true);
                let userData = {
                    createdThrough: 'WebUI',
                    createdByIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                    createTime: (new Date()).toISOString(),
                    description: "N/A",
                    userSince: (new Date()).toLocaleString()
                };
                let user = await createNewUser(
                    client, emailAddress, username, password, userData, false, isActive
                );
                return done(null, user);
            }
        });
    }

    passport.use(
        'local-login',
        new LocalStrategy({}, handleAuth)
    );

    passport.use(
        'local-register',
        new LocalStrategy({passReqToCallback: true}, handleRegister)
    )

}

module.exports = authSetup;
