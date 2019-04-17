function measurements(measurementsService){
    let operations = {
        POST
    };

    async function GET(req, res, next) {
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
                description: '???',
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
module.exports.default = measurements;
