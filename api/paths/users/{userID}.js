function user(usersService){
    let operations = {
        GET
    };

    async function GET(req, res, next) {
        let userID = req.params.userID;
        let resp = await usersService.getUserByIDAPI(userID);
        res.status(200).json(resp);
    }


    // NOTE: We could also use a YAML string here.
    GET.apiDoc = {
        summary: 'Returns a user by their ID.',
        operationId: 'getWorlds',
        tags: [
            "Users"
        ],
        parameters: [
            {
                in: "path",
                name: "userID",
                type: "integer",
                description: "The user's ID",
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
                description: 'The matching user.',
                schema: {
                    $ref: '#/definitions/WifiologyUser'
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
module.exports.default = user;