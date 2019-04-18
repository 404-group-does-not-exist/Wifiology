function measurements(measurementsService){
    let operations = {
        POST
    };

    async function GET(req, res, next) {
        let nodeID = req.params.nodeID;
        let limit = req.params.limit;
        let lastPriorMeasurementID = req.params.lastPriorMeasurementID;
        res.status(200).json({});
    }

    async function POST(req, res, next) {
        let newMeasurementData = req.body;
        let response = await measurementsService.createNewMeasurementAPI(
            newMeasurementData, req.params.nodeID, req.user.userID
        );
        res.status(200).json(response);
    }

    // NOTE: We could also use a YAML string here.
    GET.apiDoc = {
        summary: 'Get the latest measurements and information',
        operationId: 'getNodeMeasurementData',
        tags: [
            "Nodes",
            "Measurements"
        ],
        parameters: [
            {
                in: "path",
                name: "nodeID",
                type: "integer",
                description: "The ID of the Node making the measurement",
                required: true
            },
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
                description: "The last (lowest) measurement ID from the prior API call.",
                name: "lastPriorMeasurementID",
                type: "integer",
                required: false,
                default: null
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
                description: 'A list of matching measurements that have been recorded.',
                schema: {
                    type: 'array',
                    items: {
                        $ref: '#/definitions/WifiologyMeasurementDataSet'
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
        summary: 'Load a new measurement.',
        operationId: 'loadNewMeasurement',
        tags: [
            "Nodes",
            "Measurements"
        ],
        parameters: [
            {
                in: "path",
                name: "nodeID",
                type: "integer",
                description: "The ID of the Node making the measurement",
                required: true
            },
            {
                in: "body",
                description: "The new user data",
                name: "newMeasurementData",
                schema: {
                   $ref: '#/definitions/NewWifiologyMeasurement'
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
                description: 'The resulting measurement data set.',
                schema: {
                    $ref: '#/definitions/WifiologyMeasurementDataSet'
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
module.exports.default = measurements;
