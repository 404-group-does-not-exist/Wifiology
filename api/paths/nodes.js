function nodes() {
    let operations = {
        GET, POST
    };

    async function GET(req, res, next) {
        res.status(200).json({});
    }

    async function POST(req, res, next) {
        res.status(200).json({});
    }


    // NOTE: We could also use a YAML string here.
    GET.apiDoc = {
        summary: 'Return a list of all visible nodes.',
        operationId: 'getNodes',
        tags: [
            "Nodes"
        ],
        parameters: [],
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