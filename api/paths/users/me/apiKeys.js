function apiKeys(apiKeysService){
    let operations = {
        GET, POST
    };

    async function GET(req, res, next) {
        let keys = await apiKeysService.getApiKeysForUserAPI(req.user.userID);
        res.status(200).json(keys);
    }

    async function POST(req, res, next) {
        let newKeyModel = req.body;
        let keyPayload = await apiKeysService.createAPIKeyAPI(req.user.userID, newKeyModel);
        res.status(200).json(keyPayload);
    }

    // NOTE: We could also use a YAML string here.
    GET.apiDoc = {
        summary: 'Return a users keys.',
        operationId: 'getUsersApiKeys',
        tags: [
            "Users",
            "API Keys"
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
                description: 'A list of API keys.',
                schema: {
                    type: "array",
                    items: {
                        $ref: '#/definitions/WifiologyApiKeyInfo'
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
        summary: 'Register a API key.',
        operationId: 'createNewAPIKey',
        tags: [
            "Users",
            "API Keys"
        ],
        parameters: [
            {
                in: "body",
                description: "The new user data",
                name: "newUserData",
                schema: {
                    type: "object",
                    properties: {
                        description: {
                            type: 'string'
                        }
                    },
                    required: ["description"]
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
                description: 'A list of registered users.',
                schema: {
                    type: 'object',
                    properties: {
                        info: {
                            $ref: '#/definitions/WifiologyUser'
                        },
                        key: {
                            type: 'string',
                            description: 'The actual key'
                        }
                    },
                    required: ['key', 'info']
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
module.exports.default = apiKeys;
