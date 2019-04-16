function nodes(nodesService) {
    let operations = {
        GET
    };

    async function GET(req, res, next) {
        let ownerID = req.user.userID;
        let nodes = await nodesService.getNodesForOwnerAPI(ownerID);
        res.status(200).json(nodes);
    }


    // NOTE: We could also use a YAML string here.
    GET.apiDoc = {
        summary: 'Return the current users nodes.',
        operationId: 'getUsersNodes',
        tags: [
            "Users",
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

    return operations;
}

module.exports.default = nodes;