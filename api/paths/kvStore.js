function kvStore(kvService){
    let operations = {
        GET, POST
    };

    async function GET(req, res, next) {
        let limit = req.query.limit || 500;
        let offset = req.query.offset || 0;
        let allKvs = await kvService.getAllKeyValuePairsAPI(limit, offset);
        res.status(200).json(allKvs);
    }

    async function POST(req, res, next) {
        let newKvModel = req.body;
        let kvResponse = await kvService.createKeyValuePairAPI(newKvModel);
        res.status(200).json(kvResponse);
    }

    // NOTE: We could also use a YAML string here.
    GET.apiDoc = {
        summary: 'Return all items in the Key Value Store',
        operationId: 'getKvs',
        tags: [
            "KV Store"
        ],
        parameters: [
            {
                in: "query",
                description: "The limit on the number of kvs returned.",
                name: "limit",
                type: "integer",
                required: false,
                default: 500
            },
            {
                in: "query",
                description: "The offset on the number of kvs returned.",
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
                description: 'An object of Key Value Items',
                schema: {
                    type: "object"
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
        summary: 'Add a new Key Value Pair',
        operationId: 'createKvPair',
        tags: [
            "KV Store"
        ],
        parameters: [
            {
                in: "body",
                description: "The new KV Pair",
                name: "newKvData",
                schema: {
                    type: "object",
                    properties: {
                        keyName: {
                            type: 'string'
                        },
                        value: {
                           
                        }
                    },
                    required: ["keyName", "value"]
                },
                required: true
            }
        ],
        responses: {
            200: {
                description: 'An object of Key Value Pairs',
                schema: {
                    type: 'object'
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
module.exports.default = kvStore;
