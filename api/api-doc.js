let apiDoc = {
    swagger: '2.0',
    basePath: '/api/1.0',
    info: {
        title: 'Wifiology',
        version: '0.1.0'
    },
    definitions: {
        WifiologyUser: {
            type: 'object',
            properties: {
                userID: {
                    type: 'integer'
                },
                emailAddress: {
                    type: 'string'
                },
                userName: {
                    type: 'string'
                },
                userData: {
                    type: 'object'
                }
            },
            required: ['userID', 'userName']
        },
        WifiologyNode: {
            type: 'object',
            properties: {
                nodeID: {
                    type: 'integer'
                },
                nodeName: {
                    type: 'string'
                },
                nodeLastSeenTime: {
                    type: 'string'
                },
                nodeLocation: {
                    type: 'string'
                },
                nodeDescription: {
                    type: 'string'
                },
                ownerID: {
                    type: 'integer'
                },
                nodeData: {
                    type: 'object'
                },
                owner: {
                    $ref: '#/definitions/WifiologyUser'
                }
            },
            required: [
                'nodeID', 'nodeName', 'nodeLastSeenTime', 'nodeLocation', 'nodeDescription',
                'ownerID', 'nodeData'
            ]
        },
        TestThing: {
            type: 'object',
            description: 'A thing to play with OpenAPI and do a demo.'
        }
    },
    paths: {}
};

module.exports = {
  apiDoc
};