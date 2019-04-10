function users(usersService){
    let operations = {
        GET, POST
    };

    async function GET(req, res, next) {
        let limit = req.query.limit || 500;
        let offset = req.query.offset || 0;
        let allUsers = await usersService.getAllUsersAPI(limit, offset);
        res.status(200).json(allUsers);
    }

    async function POST(req, res, next) {
        let newUserModel = req.body;
        let userResponse = await usersService.createUserAPI(newUserModel);
        res.status(200).json(userResponse);
    }

    // NOTE: We could also use a YAML string here.
    GET.apiDoc = {
        summary: 'Return the registered users.',
        operationId: 'getUsers',
        tags: [
            "Users"
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
                description: 'A list of registered users.',
                schema: {
                    type: "array",
                    items: {
                        $ref: '#/definitions/WifiologyUser'
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
        summary: 'Register a new user.',
        operationId: 'createNewUser',
        tags: [
            "Users"
        ],
        parameters: [
            {
                in: "body",
                description: "The new user data",
                name: "newUserData",
                schema: {
                    type: "object",
                    properties: {
                        emailAddress: {
                            type: 'string'
                        },
                        userName: {
                            type: 'string'
                        },
                        password: {
                            type: 'string'
                        },
                        description: {
                            type: 'string'
                        }
                    },
                    required: ["emailAddress", "userName", "password"]
                },
                required: true
            }
        ],
        responses: {
            200: {
                description: 'A list of registered users.',
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
module.exports.default = users;
