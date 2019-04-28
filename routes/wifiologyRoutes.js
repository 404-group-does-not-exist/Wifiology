const wifiologyNodesData = require("../db/data/wifiologyNode");
const {
    getMeasurementDataSetsByNodeID, getMeasurementDataSetsByNodeIDAndChannel, measurementDataSetToApiResponse
} = require('../db/data/wifiologyMeasurement');
const { getApiKeysByOwnerID, createNewApiKey, getApiKeyByID, deleteApiKey } = require("../db/data/wifiologyApiKey");
const { getAllUsers, getUserByID } = require('../db/data/wifiologyUser');
const { getWifiologyNodeByName, createNewWifiologyNode } = require('../db/data/wifiologyNode');
const { version } = require("../info");
const { spawnClientFromPool, commit, release, rollback } = require("../db/core");

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
                req, res, {title: "Wifiology Home", scriptToRun: 'wifiologyAllSetup();'}
            )
        );
    }


    async function loginGetHandler(req, res){
        if(!req.user){
            res.render(
                'pages/login',
                await templateObjectGenerator(
                    req, res,{title: "Login To Wifiology", scriptToRun: 'wifiologyAllSetup();'}
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
                    req, res,{title: "Register For Wifiology", scriptToRun: 'wifiologyAllSetup();'}
                )
            );
        } else {
            res.redirect('/');
        }
    }

    async function usersGetHandler(req, res){
        let client = await spawnClientFromPool(dbPool, false);
        try{
            let users = await getAllUsers(client, 1000,0);
            res.render(
                'pages/users',
                await templateObjectGenerator(
                    req, res, {title: `Wifiology Users`, users, scriptToRun: 'wifiologyAllSetup();'}
                )
            );
        }
        finally {
            await release(client);
        }

    }

    async function userGetHandler(req, res){
        let client = await spawnClientFromPool(dbPool, false);
        try{
            let apiKeys;
            let userID = parseInt(req.params.userID);
            let user = await getUserByID(client, userID);
            if(req.user.isAdmin || req.user.userID === userID){
                apiKeys = await getApiKeysByOwnerID(client, user.userID);
            }
            res.render(
                'pages/user',
                await templateObjectGenerator(
                    req, res, {
                        title: `Wifiology User -- ${user.userName}`,
                        targetUser: user,
                        apiKeys: apiKeys,
                        scriptToRun: `wifiologyAllSetup(); wifiologyUserSetup(${userID}, ${req.user.userID}, '/api/internal');`,
                        allowAPIKeyCreation: userID === req.user.userID
                    }
                )
            );
        }
        finally {
            await release(client);
        }

    }

    async function myUserGetHandler(req, res){
        let client = await spawnClientFromPool(dbPool, false);
        try{
            let user = await getUserByID(client, req.user.userID);
            res.render(
                'pages/user',
                await templateObjectGenerator(
                    req, res, {
                        title: `Wifiology User -- ${user.userName}`, targetUser: user,
                        scriptToRun: `wifiologyAllSetup(); wifiologyUserSetup(${req.user.userID}, ${req.user.userID}, '/api/internal');`,
                        apiKeys:  await getApiKeysByOwnerID(client, user.userID),
                        allowAPIKeyCreation: true
                    }
                )
            );
        }
        finally {
            await release(client);
        }

    }

    async function apiKeyCreatePostHandler(req, res){
        let client = await spawnClientFromPool(dbPool);
        try{
            let newApiKey = await createNewApiKey(client, req.user.userID, req.body.apiKeyDescription);
            await commit(client);
            res.setHeader('Content-Type', 'application/json');
            let response = {
                key: newApiKey.key,
                info: newApiKey.info.toApiResponse()
            };
            res.end(JSON.stringify(response));
        }
        finally {
            await release(client);
        }
    }

    async function apiKeyDeleteHandler(req, res){
        let client = await spawnClientFromPool(dbPool);
        try{
            let apiKey = await getApiKeyByID(client, parseInt(req.params.apiKeyID));
            res.setHeader('Content-Type', 'application/json');
            if(!apiKey){
                rollback(client);
                res.status(400);
                res.end(JSON.stringify({
                    'error': "InvalidAPIKeyID",
                    'message': `The specified API Key ID doesn't exist`
                }));

            }
            else if(!req.user.isAdmin && !(req.user.userID === apiKey.ownerID)){
                console.log(req.user, apiKey);
                rollback(client);
                res.status(403);
                res.end(JSON.stringify({
                    'error': "Unprivileged",
                    'message': `Not allowed to delete this API key.`
                }));
            }
            else {
                await deleteApiKey(client, apiKey.apiKeyID);
                await commit(client);
                res.end(
                    JSON.stringify({
                        'success': true
                    })
                )
            }
        }
        finally {
            await release(client);
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
                    req, res,{
                        title: "Nodes", userNodes, publicNodes,
                        scriptToRun: 'wifiologyAllSetup(); wifiologyNodesSetup();'
                    }
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
                    {
                        title: `Node ${node.nodeID}`,
                        node,
                        scriptToRun: `wifiologyAllSetup(); wifiologyNodeSetup(${nodeID}, '/api/internal')`
                    }
                )
            );
        }
        finally{
            await release(client);
        }
    }

    async function nodeCreateGetHandler(req, res){
        let client = await spawnClientFromPool(dbPool, false);
        try {

            res.render(
                'pages/newNode',
                await templateObjectGenerator(
                    req, res,
                    {
                        title: `Create Node`,
                        scriptToRun: `wifiologyAllSetup();`
                    }
                )
            );
        }
        finally{
            await release(client);
        }
    }

    async function nodeCreatePostHandler(req, res){
        let client = await spawnClientFromPool(dbPool);
        try {
            let nodeName = req.body.nodeName;
            let nodeLocation = req.body.nodeLocation;
            let nodeDescription = req.body.nodeDescription;
            let isPublic = Boolean(req.body.isPublic);

            if(!nodeName || !nodeLocation || !nodeDescription){
                await rollback(client);
                req.flash("error", "Node name, location or description not specified!");
                res.redirect("/nodes/new");
            }
            else{
                let existingNode = await getWifiologyNodeByName(client, nodeName);
                if(existingNode){
                    await rollback(client);
                    req.flash("error", `A node with the name ${nodeName} already exists!`);
                    res.redirect("/nodes/new");

                }
                else{
                    let newNode = await createNewWifiologyNode(
                        client, nodeName, nodeLocation, nodeDescription,
                        req.user.userID, isPublic,
                        {creationTime: new Date().toLocaleDateString()}
                    );
                    await commit(client);
                    req.flash("info", `Successfully created new node (ID: ${newNode.nodeID})`);
                    res.redirect(`/nodes/${newNode.nodeID}`);
                }

            }

        }
        catch(e){
            await rollback(client);
            req.flash("error", "Unhandled error!");
            res.redirect("/");
        }
        finally{
            await release(client);
        }
    }

    async function nodeChartGetHandler(req, res){
        let nodeID = parseInt(req.params.nodeID);
        let client = await spawnClientFromPool(dbPool, false);
        try {
            let node = await wifiologyNodesData.getWifiologyNodeByID(client, nodeID);
            if(!node){
                req.flash("error", `Invalid Node ID: ${nodeID}`);
                res.redirect("/");
            }
            res.render(
                'pages/nodeChart',
                await templateObjectGenerator(
                    req, res,
                    {
                        title: `Node ${node.nodeID} Chart`,
                        node,
                        scriptToRun: `wifiologyAllSetup(); wifiologyNodeChartSetup(${nodeID}, '/api/internal')`
                    }
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
    app.post('/login',
        passport.authenticate(
            'local-login',
            {failureRedirect: '/login', failureFlash: true}
        ),
        loginPostHandler
    );
    app.get('/logout', authenticatedAsyncHandler(logoutGetHandler));
    app.get('/register', asyncHandler(registrationGetHandler));
    app.post('/register',
        passport.authenticate(
            'local-register',
            {failureRedirect: '/register', failureFlash: true}
        ),
        registrationPostHandler
    );

    app.get('/users', authenticatedAsyncHandler(usersGetHandler));
    app.get('/users/me', authenticatedAsyncHandler(myUserGetHandler));
    app.get('/users/:userID', authenticatedAsyncHandler(userGetHandler));

    app.get('/nodes', authenticatedAsyncHandler(nodesGetHandler));
    app.get('/nodes/new', authenticatedAsyncHandler(nodeCreateGetHandler));
    app.post('/nodes/new', authenticatedAsyncHandler(nodeCreatePostHandler));
    app.get('/nodes/:nodeID', authenticatedAsyncHandler(nodeGetHandler));
    app.get('/nodes/:nodeID/chart', authenticatedAsyncHandler(nodeChartGetHandler));

    app.get('/api/internal/nodes/:nodeID/measurements', authenticatedAsyncHandler(secretNodeMeasurementsAPI));
    app.post('/api/internal/users/apiKey', authenticatedAsyncHandler(apiKeyCreatePostHandler));
    app.delete('/api/internal/users/apiKey/:apiKeyID', authenticatedAsyncHandler(apiKeyDeleteHandler));

}

module.exports = routesConstructor;
