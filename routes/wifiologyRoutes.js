const wifiologyNodesData = require("../db/data/wifiologyNode");
const {
    getMeasurementDataSetsByNodeID, getMeasurementDataSetsByNodeIDAndChannel, measurementDataSetToApiResponse
} = require('../db/data/wifiologyMeasurement');
const { getApiKeysByOwnerID, createNewApiKey, getApiKeyByID, deleteApiKey } = require("../db/data/wifiologyApiKey");
const { getAllUsers, getUserByID } = require('../db/data/wifiologyUser');
const { getWifiologyNodeByName, createNewWifiologyNode, getNodesAvailableToUser } = require('../db/data/wifiologyNode');
const { getDistinctServiceSetsByNodeIDs, getServiceSetByID, getServiceSetRecentData } = require('../db/data/wifiologyServiceSet');
const { getServiceSetBusyStatusFromJitter } = require('../db/data/wifiologyServiceSetJitterMeasurement');
const { getDatabaseInfo } = require('../db/data/wifiologyInfo');
const { version } = require("../info");
const { connectionWrapper, transactionWrapper } = require("../db/core");

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
    const asyncHandler = fn => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };


    const authenticatedAsyncHandler = fn => (req, res, next) => {
        if(!req.user){
            res.redirect("/login");
        }  else {
            return Promise.resolve(fn(req, res, next)).catch(next);
        }
    };

    async function indexGetHandler(req, res) {
        return await connectionWrapper(dbPool, async function(client){
           let info = await getDatabaseInfo(client);
            res.render(
                'pages/index',
                await templateObjectGenerator(
                    req, res, {
                        title: "Wifiology Home",
                        info,
                        scriptToRun: 'wifiologyAllSetup();'
                    }
                )
            );
        });

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
        return await connectionWrapper(dbPool, async function(client){
            let users = await getAllUsers(client, 1000,0);
            res.render(
                'pages/users',
                await templateObjectGenerator(
                    req, res, {title: `Wifiology Users`, users, scriptToRun: 'wifiologyAllSetup();'}
                )
            );
        });
    }

    async function userGetHandler(req, res){
        return await connectionWrapper(dbPool, async function(client){
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
        });
    }

    async function myUserGetHandler(req, res){
        return await connectionWrapper(dbPool, async function(client){
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
        });
    }

    async function apiKeyCreatePostHandler(req, res){
        return await transactionWrapper(dbPool, async function(client){
            let newApiKey = await createNewApiKey(client, req.user.userID, req.body.apiKeyDescription);
            res.setHeader('Content-Type', 'application/json');
            let response = {
                key: newApiKey.key,
                info: newApiKey.info.toApiResponse()
            };
            res.end(JSON.stringify(response));
        });
    }

    async function apiKeyDeleteHandler(req, res){
        return await transactionWrapper(dbPool, async function(client){
            let apiKey = await getApiKeyByID(client, parseInt(req.params.apiKeyID));
            res.setHeader('Content-Type', 'application/json');
            if(!apiKey){
                res.status(400);
                res.end(JSON.stringify({
                    'error': "InvalidAPIKeyID",
                    'message': `The specified API Key ID doesn't exist`
                }));

            }
            else if(!req.user.isAdmin && !(req.user.userID === apiKey.ownerID)){
                console.log(req.user, apiKey);
                res.status(403);
                res.end(JSON.stringify({
                    'error': "Unprivileged",
                    'message': `Not allowed to delete this API key.`
                }));
            }
            else {
                await deleteApiKey(client, apiKey.apiKeyID);
                res.end(
                    JSON.stringify({
                        'success': true
                    })
                )
            }
        });
    }

    async function nodesGetHandler(req, res){
        return await connectionWrapper(dbPool, async function(client){
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
        });
    }

    async function nodeGetHandler(req, res){
        let nodeID = parseInt(req.params.nodeID);
        return await connectionWrapper(dbPool, async function(client){
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
        });
    }

    async function nodeCreateGetHandler(req, res){
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

    async function nodeCreatePostHandler(req, res){
        return await transactionWrapper(dbPool, async function(client){
            let nodeName = req.body.nodeName;
            let nodeLocation = req.body.nodeLocation;
            let nodeDescription = req.body.nodeDescription;
            let isPublic = Boolean(req.body.isPublic);

            if(!nodeName || !nodeLocation || !nodeDescription){
                req.flash("error", "Node name, location or description not specified!");
                res.redirect("/nodes/new");
            }
            else{
                let existingNode = await getWifiologyNodeByName(client, nodeName);
                if(existingNode){
                    req.flash("error", `A node with the name ${nodeName} already exists!`);
                    res.redirect("/nodes/new");

                }
                else{
                    let newNode = await createNewWifiologyNode(
                        client, nodeName, nodeLocation, nodeDescription,
                        req.user.userID, isPublic,
                        {creationTime: new Date().toLocaleDateString()}
                    );
                    req.flash("info", `Successfully created new node (ID: ${newNode.nodeID})`);
                    res.redirect(`/nodes/${newNode.nodeID}`);
                }

            }
        });
    }

    async function nodeChartGetHandler(req, res){
        let nodeID = parseInt(req.params.nodeID);
        return await connectionWrapper(dbPool, async function(client){
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
        });
    }

    async function networksGetHandler(req, res){
        return await connectionWrapper(dbPool, async function(client){
            let nodesAvailable = await getNodesAvailableToUser(client, req.user.userID, 9999, 0);
            let nodeIDs = nodesAvailable.map(n => n.nodeID);
            let serviceSetsMap = await getDistinctServiceSetsByNodeIDs(client, nodeIDs);
            let networkServiceSets = {};

            for(let measurementNodeID of Object.keys(serviceSetsMap)){
                 serviceSetsMap[measurementNodeID].reduce(function(acc, ss){
                    if(!acc.hasOwnProperty(ss.networkName)){
                        acc[ss.networkName] = {};
                    }
                    if(!acc[ss.networkName].hasOwnProperty(ss.bssid)){
                        acc[ss.networkName][ss.bssid] = {
                            serviceSet: ss,
                            nodeIDs: [measurementNodeID]
                        }
                    }
                    else {
                        acc[ss.networkName][ss.bssid].nodeIDs.push(measurementNodeID)
                    }
                    return acc;
                }, networkServiceSets);
            }


            res.render(
                'pages/networks',
                await templateObjectGenerator(
                    req, res,
                    {
                        title: `Networks`,
                        networkServiceSets,
                        scriptToRun: `wifiologyAllSetup();`
                    }
                )
            );
        });
    }

    async function serviceSetGetHandler(req, res){
        return await connectionWrapper(dbPool, async function(client){
            let serviceSetID = parseInt(req.params.serviceSetID);
            let serviceSet = await getServiceSetByID(client, serviceSetID);
            let busyData = await getServiceSetBusyStatusFromJitter(client, serviceSetID);
            if(!serviceSet){
                req.flash('error', `No such service set with ID ${serviceSetID}!`);
                res.redirect('/');
            } else {
                res.render(
                    'pages/basicServiceSet',
                    await templateObjectGenerator(
                        req, res,
                        {
                            title: `Service Set ${serviceSetID}`,
                            serviceSet,
                            busyData,
                            scriptToRun: `wifiologyAllSetup(); wifiologyServiceSetSetup(${serviceSetID}, '/api/internal');`
                        }
                    )
                )
            }
        });
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
        let channel;
        if(req.query.channel){
            channel = parseInt(req.query.channel);
        } else {
            channel = null;
        }
        let nodeID = parseInt(req.params.nodeID);
        return await transactionWrapper(dbPool, async function(client){
            res.setHeader('Content-Type', 'application/json');
            let node = await wifiologyNodesData.getWifiologyNodeByID(client, nodeID);
            if(!node){
                res.status(404);
                res.end(JSON.stringify({
                    error: 'InvalidNodeID',
                    message: `Node ID ${nodeID} does not correspond to a real node.`
                }))
            }
            else {
                let measurementDataSets;
                if(channel === null){
                    measurementDataSets = await getMeasurementDataSetsByNodeID(client, nodeID, 75);
                } else {
                    measurementDataSets = await getMeasurementDataSetsByNodeIDAndChannel(client, nodeID, channel, 75);
                }
                res.end(JSON.stringify(
                    measurementDataSets.map(measurementDataSetToApiResponse)
                ));
            }
        });
    }

    async function serviceSetMeasurementAPI(req, res){
        let serviceSetID = parseInt(req.params.serviceSetID);

        function convertDataCounterMap(dcm){
            let newMap = {};
            for(let mID of Object.keys(dcm)){
                newMap[mID] = dcm[mID].toApiResponse();
            }
            return newMap;
        }

        return await connectionWrapper(dbPool, async function(client){
            let nodesAvailable = await getNodesAvailableToUser(client, req.user.userID, 9999, 0);
            let nodeIDs = nodesAvailable.map(n => n.nodeID);
            res.setHeader('Content-Type', 'application/json');
            let serviceSet = await getServiceSetByID(client, serviceSetID);
            if(!serviceSet){
                res.status(404);
                res.end(JSON.stringify({
                    error: 'InvalidServiceSetID',
                    message: `Service Set ID ${serviceSetID} does not correspond to a real service set.`
                }))
            } else {
                let serviceSetData = await getServiceSetRecentData(client, serviceSetID, nodeIDs, 75);
                let finalized = {
                    measurements: serviceSetData.measurements.map(m => m.toApiResponse()),
                    infrastructureMacAddresses: serviceSetData.infrastructureMacAddresses,
                    infrastructureMacAddressManufacturerCounts: serviceSetData.infrastructureMacAddressManufacturerCounts,
                    associatedMacAddressManufacturerCounts: serviceSetData.associatedMacAddressManufacturerCounts,
                    associatedMacAddresses: serviceSetData.associatedMacAddresses,
                    infrastructureDataCounters: convertDataCounterMap(serviceSetData.infrastructureDataCounters),
                    associatedStationsDataCounters: convertDataCounterMap(serviceSetData.associatedStationsDataCounters)
                };
                res.end(JSON.stringify(finalized));
            }
        });
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

    app.get('/networks', authenticatedAsyncHandler(networksGetHandler));
    app.get('/serviceSets/:serviceSetID', authenticatedAsyncHandler(serviceSetGetHandler));

    app.get('/api/internal/nodes/:nodeID/measurements', authenticatedAsyncHandler(secretNodeMeasurementsAPI));
    app.get('/api/internal/serviceSets/:serviceSetID/measurements', authenticatedAsyncHandler(serviceSetMeasurementAPI));
    app.post('/api/internal/users/apiKey', authenticatedAsyncHandler(apiKeyCreatePostHandler));
    app.delete('/api/internal/users/apiKey/:apiKeyID', authenticatedAsyncHandler(apiKeyDeleteHandler));
}

module.exports = routesConstructor;
