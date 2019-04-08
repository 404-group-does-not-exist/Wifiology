function testThing(testThingService){
    let operations = {
        GET
    };

    function GET(req, res, next) {
        res.status(200).json(testThingService.getTestThing());
    }

    // NOTE: We could also use a YAML string here.
    GET.apiDoc = {
        summary: 'Returns worlds by name.',
        operationId: 'getWorlds',
        parameters: [],
        responses: {
            200: {
                description: 'A list of worlds that match the requested name.',
                schema: {
                    $ref: '#/definitions/TestThing'
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
module.exports.default = testThing;
