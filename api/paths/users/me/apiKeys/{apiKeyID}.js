function apiKey(apiKeysService){
    let operations = {
        GET, DELETE
    };

    async function GET(req, res, next) {
        let key = await apiKeysService.getApiKeyByIDAPI(req.user.userID, req.params.apiKeyID);
        res.status(200).json(key);
    }

    async function DELETE(req, res, next) {
        let result = await apiKeysService.deleteApiKeyByIDAPI(req.user.userID, req.params.apiKeyID);
        res.status(200).json(result);
    }

    // NOTE: We could also use a YAML string here.
    GET.apiDoc = {
        summary: 'Return an individual key.',
        operationId: 'getUsersApiKey',
        tags: [
            "Users",
            "API Keys"
        ],
        parameters: [
            {
                type: 'integer',
                in: 'path',
                name: 'apiKeyID',
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
                description: 'An API key, if found.',
                schema: {
                    $ref: '#/definitions/WifiologyApiKeyInfo'
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

    DELETE.apiDoc = {
        summary: 'Delete an API key.',
        operationId: 'deleteAPIKey',
        tags: [
            "Users",
            "API Keys"
        ],
        parameters: [
            {
                type: 'integer',
                in: 'path',
                name: 'apiKeyID',
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
                description: 'Succesfully delted the key.',
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
module.exports.default = apiKey;
