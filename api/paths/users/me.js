function user(usersService){
    let operations = {
        GET
    };

    async function GET(req, res, next) {
        let userID = req.user.userID;
        let resp = await usersService.getUserByIDAPI(userID);
        res.status(200).json(resp);
    }


    // NOTE: We could also use a YAML string here.
    GET.apiDoc = {
        summary: 'Returns user data for the current user.',
        operationId: 'getWorlds',
        tags: [
            "Users"
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
                description: 'The user data.',
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