function nodes() {
    let operations = {
        GET
    };

    async function GET(req, res, next) {
        res.status(200).json({});
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