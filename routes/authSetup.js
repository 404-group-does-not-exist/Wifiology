const { getUserByUserName, getUserByID, getUserByEmailAddress, createNewUser } = require('../db/data/wifiologyUser');
const { spawnClientFromPool, release, commit, rollback } = require('../db/core');
const LocalStrategy = require('passport-local').Strategy;


function authSetup(passport, dbPool, featureFlags){
    passport.serializeUser( function(user, done){
        done(null, user.userID);
    });

    passport.deserializeUser(async function(userID, done){
        let client = await spawnClientFromPool(dbPool, false);
        try{
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

        }
        catch(e){
            return done(e);
        }
        finally {
            await release(client);
        }
    });

    async function handleAuth(username, password, done){
        let client = await spawnClientFromPool(dbPool, false);
        try{
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

        }
        catch(e){
            return done(e);
        }
        finally {
            await release(client);
        }
    }

    async function handleRegister(req, username, password, done){
        let client = await spawnClientFromPool(dbPool);
        let emailAddress = req.body.emailAddress;
        try{

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
                    createTime: new Date().toISOString(),
                    description: "N/A",
                    userSince: new Date.toLocaleString()
                };
                let user = await createNewUser(
                    client, emailAddress, username, password, userData, false, isActive
                );
                await commit(client);
                return done(null, user);
            }

        }
        catch(e){
            await rollback(client);
            return done(e);
        }
        finally {
            await release(client);
        }
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
