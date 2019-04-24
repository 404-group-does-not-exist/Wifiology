const wifiologyNodesData = require("../db/data/wifiologyNode");
const {
    getMeasurementDataSetsByNodeID, getMeasurementDataSetsByNodeIDAndChannel, measurementDataSetToApiResponse
} = require('../db/data/wifiologyMeasurement');
const { version } = require("../info");
const { spawnClientFromPool, commit, release } = require("../db/core");

function routesConstructor(app, passport, dbPool){
    async function templateObjectGenerator(req, res, moreData=null){
        let params =  {
            version,
            user: req.user,
            messages: req.flash()
        };
        if(moreData){
            params = {...params, ...moreData};
        }
        return Promise.resolve(params);
    }

    // From: https://www.acuriousanimal.com/2018/02/15/express-async-middleware.html
    const asyncHandler = fn => (req, res, next) =>
        Promise.resolve(fn(req, res, next)).catch(next);

    const authenticatedAsyncHandler = fn => (req, res, next) => {
        if(!req.user){
            res.redirect("/login");
        }  else {
            return Promise.resolve(fn(req, res, next)).catch(next);
        }
    };

    async function indexGetHandler(req, res) {
        res.render(
            'pages/index',
            await templateObjectGenerator(
                req, res, {title: "Wifiology Home"}
            )
        );
    }


    async function loginGetHandler(req, res){
        if(!req.user){
            res.render(
                'pages/login',
                await templateObjectGenerator(
                    req, res,{title: "Login To Wifiology"}
                )
            );
        } else {
            res.redirect('/');
        }

    }

    async function logoutGetHandler(req, res){
        req.logout();
        req.flash('success', 'Logged out successfully.');
        res.redirect("/login");
    }

    async function registrationGetHandler(req, res){
        if(!req.user){
            res.render(
                'pages/register',
                await templateObjectGenerator(
                    req, res,{title: "Register For Wifiology"}
                )
            );
        } else {
            res.redirect('/');
        }
    }

    async function nodesGetHandler(req, res){
        let client = await spawnClientFromPool(dbPool, false);
        try{
            let userNodes = await wifiologyNodesData.getWifiologyNodesByOwnerID(client, req.user.userID);
            let publicNodes = await wifiologyNodesData.getAllPublicWifiologyNodes(client, 100, 0);
            res.render(
                'pages/nodes',
                await templateObjectGenerator(
                    req, res,{title: "Nodes", userNodes, publicNodes, scriptToRun: 'wifiologyNodesSetup()'}
                )
            );
        }
        finally{
            await release(client);
        }
    }

    async function nodeGetHandler(req, res){
        let nodeID = parseInt(req.params.nodeID);
        let client = await spawnClientFromPool(dbPool, false);
        try {
            let node = await wifiologyNodesData.getWifiologyNodeByID(client, nodeID);
            if(!node){
                req.flash("error", `Invalid Node ID: ${nodeID}`);
                res.redirect("/");
            }
            res.render(
                'pages/node',
                await templateObjectGenerator(
                    req, res,
                    {title: "Nodes", node, scriptToRun: `wifiologyNodeSetup(${nodeID}, '/api/internal')`}
                )
            );
        }
        finally{
            await release(client);
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

    async function secretNodeMeasurementsAPI(req, res){
        let nodeID = parseInt(req.params.nodeID);
        let channel;
        if(req.query.channel){
            channel = parseInt(req.query.channel);
        } else {
            channel = null;
        }

        let client = await spawnClientFromPool(dbPool, false);
        try {
            res.setHeader('Content-Type', 'application/json');
            let node = await wifiologyNodesData.getWifiologyNodeByID(client, nodeID);
            if(!node){
                res.end(JSON.stringify({
                    error: 'InvalidNodeID',
                    message: `Node ID ${nodeID} does not correspond to a real node.`
                }))
            }
            else {
                let measurementDataSets;
                if(channel === null){
                    measurementDataSets = await getMeasurementDataSetsByNodeID(client, nodeID, 50);
                } else {
                    measurementDataSets = await getMeasurementDataSetsByNodeIDAndChannel(client, nodeID, channel, 50);
                }
                res.end(JSON.stringify(
                    measurementDataSets.map(measurementDataSetToApiResponse)
                ));
            }
        }
        finally{
            await release(client);
        }
    }

    app.get('/', authenticatedAsyncHandler(indexGetHandler));
    app.get('/login', asyncHandler(loginGetHandler));
    app.get('/logout', authenticatedAsyncHandler(logoutGetHandler));
    app.get('/register', asyncHandler(registrationGetHandler));

    app.get('/nodes', authenticatedAsyncHandler(nodesGetHandler));
    app.get('/nodes/:nodeID', authenticatedAsyncHandler(nodeGetHandler));
    app.get('/api/internal/nodes/:nodeID/measurements', authenticatedAsyncHandler(secretNodeMeasurementsAPI));

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
