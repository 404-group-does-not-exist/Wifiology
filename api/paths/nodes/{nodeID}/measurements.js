function measurements(measurementsService){
    let operations = {
        GET, POST
    };

    async function GET(req, res, next) {
        let nodeID = req.params.nodeID;
        let channel = req.query.channel;
        let limit = req.query.limit;
        let lastPriorMeasurementID = req.query.lastPriorMeasurementID || null;
        let response = await measurementsService.getNodeMeasurementDataSetsAPI(
            nodeID, channel, limit, lastPriorMeasurementID, req.user.userID
        );
        res.status(200).json(response);
    }

    async function POST(req, res, next) {
        let newMeasurementData = req.body;
        let response = await measurementsService.createNewMeasurementAPI(
            newMeasurementData, req.params.nodeID, req.user.userID
        );
        res.status(response.statusCode).json(response.result);
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
                name: "channel",
                type: "integer",
                description: "The channel to filter measurements on.",
                required: false,
                default: null
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
            303: {
                description: 'A matching measurement has been found in the database; the uploaded measurement will not be recorded.',
                schema: {
                    type: 'object',
                    properties: {
                        warning: { type: 'string' },
                        measurement: {
                            $ref: '#/definitions/WifiologyMeasurement',
                            description: 'The existing matching measurement.'
                        }
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
