function nodes(nodesService) {
    let operations = {
        GET, POST
    };

    async function GET(req, res, next) {
        let limit = req.query.limit || 500;
        let offset = req.query.offset || 0;
        let allNodes = await nodesService.getAllWifiologyNodes(limit, offset, req.user);
        res.status(200).json(allNodes);
    }

    async function POST(req, res, next) {
        let newNodeData = req.body;
        let ownerID = req.user.userID;
        let newNode = await nodesService.createNodeAPI(newNodeData, ownerID);
        res.status(200).json(newNode);
    }


    // NOTE: We could also use a YAML string here.
    GET.apiDoc = {
        summary: 'Return a list of all visible nodes.',
        operationId: 'getNodes',
        tags: [
            "Nodes"
        ],
        parameters: [
            {
                in: "query",
                description: "The limit on the number of users returned.",
                name: "limit",
                type: "integer",
                required: false,
                default: 500
            },
            {
                in: "query",
                description: "The offset on the number of users returned.",
                name: "offset",
                type: "integer",
                required: false,
                default: 0
            }
        ],
        security: [
            {
                'BasicAuth': []
            },
            {
                'ApiKeyAuth': []
            }
        ],
        responses: {
            200: {
                description: 'A list of Nodes.',
                schema: {
                    type: "array",
                    items: {
                        $ref: '#/definitions/WifiologyNode'
                    }

                }
            },
            default: {
                description: 'An error occurred',
                schema: {
                    additionalProperties: true
                }
            }
        }
    };

    POST.apiDoc = {
        summary: 'Register a new node.',
        operationId: 'createNewNode',
        tags: [
            "Nodes"
        ],
        parameters: [
            {
                in: "body",
                description: "The new user data",
                name: "newNodeData",
                schema: {
                    type: "object",
                    properties: {
                        nodeName: {
                            type: "string"
                        },
                        nodeLocation: {
                            type: "string"
                        },
                        nodeDescription: {
                            type: "string"
                        },
                        isPublic: {
                            type: "boolean"
                        },
                        nodeData: {
                            type: "object"
                        }
                    },
                    required: ["nodeName", "nodeLocation", "nodeDescription", "isPublic", "nodeData"]
                },
                required: true
            }
        ],
        security: [
            {
                'BasicAuth': []
            },
            {
                'ApiKeyAuth': []
            }
        ],
        responses: {
            200: {
                description: 'The new node data.',
                schema: {
                    $ref: '#/definitions/WifiologyNode'

                }
            },
            default: {
                description: 'An error occurred',
                schema: {
                    additionalProperties: true
                }
            }
        }
    };
    return operations;
}

module.exports.default = nodes;