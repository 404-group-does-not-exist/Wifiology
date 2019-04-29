let apiDoc = {
    swagger: '2.0',
    basePath: '/api/1.0',
    info: {
        title: 'Wifiology',
        version: require('../info').version || '???'
    },
    definitions: {
        WifiologyUser: {
            type: 'object',
            properties: {
                userID: {
                    type: 'integer'
                },
                emailAddress: {
                    type: 'string'
                },
                userName: {
                    type: 'string'
                },
                userData: {
                    type: 'object'
                }
            },
            required: ['userID', 'userName']
        },
        WifiologyApiKeyInfo: {
            type: 'object',
            properties: {
                apiKeyID: {
                    type: 'integer'
                },
                ownerID: {
                    type: 'integer'
                },
                apiKeyDescription: {
                    type: 'string'
                },
                apiKeyExpiry: {
                    type: 'string'
                }
            }
        },
        WifiologyNode: {
            type: 'object',
            properties: {
                nodeID: {
                    type: 'integer'
                },
                nodeName: {
                    type: 'string'
                },
                nodeLastSeenTime: {
                    type: 'string'
                },
                nodeLocation: {
                    type: 'string'
                },
                nodeDescription: {
                    type: 'string'
                },
                ownerID: {
                    type: 'integer'
                },
                nodeData: {
                    type: 'object'
                },
                isPublic:{
                    type: 'boolean'
                },
                owner: {
                    $ref: '#/definitions/WifiologyUser'
                }
            },
            required: [
                'nodeID', 'nodeName', 'nodeLastSeenTime', 'nodeLocation', 'nodeDescription',
                'ownerID', 'nodeData'
            ]
        },
        WifiologyDataCounters: {
            type: 'object',
            properties: {
                
                managementFrameCount: { type: 'integer' },
                associationFrameCount: { type: 'integer' },
                reassociationFrameCount: { type: 'integer' },
                disassociationFrameCount: { type: 'integer' },
                controlFrameCount: { type: 'integer' },
                rtsFrameCount: { type: 'integer' },
                ctsFrameCount: { type: 'integer' },
                ackFrameCount: { type: 'integer' },
                dataFrameCount: { type: 'integer' },
                dataThroughputIn: { type: 'integer' },
                dataThroughputOut: { type: 'integer' },
                retryFrameCount: { type: 'integer' },
                averagePower: {type: 'number'},
                stdDevPower: {type: 'number'},
                lowestRate: { type: 'integer' },
                highestRate: { type: 'integer' },
                failedFCSCount: { type: 'integer' }
            },
            required: [
                'managementFrameCount', 'associationFrameCount', 'reassociationFrameCount',
                'disassociationFrameCount', 'controlFrameCount', 'rtsFrameCount', 'ctsFrameCount',
                'ackFrameCount', 'dataFrameCount', 'dataThroughputIn', 'dataThroughputOut',
                'retryFrameCount'
            ]
        },
        WifiologyServiceSetJitterMeasurement: {
            type: 'object',
            properties: {
                measurementID: { type: 'integer' },
                serviceSetID: { type: 'integer' },
                minJitter: { type: 'number' },
                maxJitter: { type: 'number' },
                avgJitter: { type: 'number' },
                stdDevJitter: { type: 'number' },
                jitterHistogram: {
                    type: 'string',
                    description: 'The HDRHistogram, encoded, for this jitter measurement.'
                },
                jitterHistogramOffset: { type: 'number' },
                beaconInterval: { type: 'integer' },
                extraData: { type: 'object' }
            }
        },
        WifiologyMeasurement: {
            type: 'object',
            properties: {
                measurementID: { type: 'integer' },
                measurementNodeID: { type: 'integer' },
                measurementStartTime: { type: 'string' },
                measurementEndTime: { type: 'string' },
                measurementDuration: { type: 'number' },
                channel: { type: 'integer' },
                averageNoise: { type: 'number' },
                stdDevNoise: { type: 'number' },
                dataCounters: { $ref: '#/definitions/WifiologyDataCounters' },
                extraData: { type: 'object' }
            },
            required: [
                'measurementID', 'measurementNodeID', 'measurementStartTime', 'measurementEndTime',
                'measurementDuration', 'channel', 'extraData'
            ]
        },
        WifiologyStation: {
            type: 'object',
            properties: {
                stationID: { type: 'integer' },
                macAddress: { type: 'string' },
                extraData: { type: 'object' },
                dataCounters: { $ref: '#/definitions/WifiologyDataCounters' }
            },
            required: ['stationID', 'macAddress']
        },
        WifiologyServiceSet: {
            type: 'object',
            properties: {
                serviceSetID: { type: 'integer' },
                bssid: { type: 'string' },
                networkName: { type: 'string' },
                infrastructureMacAddresses: {
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                },
                associatedMacAddresses: {
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                },
                dataCounters: { $ref: '#/definitions/WifiologyDataCounters' },
                jitterMeasurement: { $ref: '#/definitions/WifiologyServiceSetJitterMeasurement' },
                extraData: {
                    type: 'object'
                }

            },
            required: ['serviceSetID', 'bssid']
        },
        WifiologyMeasurementDataSet: {
            type: 'object',
            properties: {
                measurement: { $ref: '#/definitions/WifiologyMeasurement' },
                stations: {
                    type: 'array',
                    items: { $ref: '#/definitions/WifiologyStations' }
                },
                serviceSets: {
                    type: 'array',
                    items: { $ref: '#/definitions/WifiologyServiceSets' }
                }
            }
        },
        NewWifiologyMeasurementStation: {
            type: 'object',
            properties: {
                macAddress: {
                    type: 'string'
                },
                dataCounters: {
                    $ref: '#/definitions/WifiologyDataCounters'
                },
                extraData: {
                    type: 'object'
                }
            },
            required: ['macAddress', 'dataCounters']
        },

        NewWifiologyMeasurementServiceSet: {
            type: 'object',
            properties: {
                bssid: {
                    type: 'string'
                },
                networkName: {
                    type: 'string'
                },
                infrastructureMacAddresses: {
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                },
                associatedMacAddresses: {
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                },
                jitterMeasurement: {
                    $ref: '#/definitions/WifiologyServiceSetJitterMeasurement'
                },
                extraData: {
                    type: 'object'
                }
            },
            required: ['bssid', 'infrastructureMacAddresses', 'associatedMacAddresses']
        },
        NewWifiologyMeasurement: {
            type: 'object',
            properties: {
                measurementStartTime: {
                    type: 'number'
                },
                measurementEndTime: {
                    type: 'number'
                },
                measurementDuration: {
                    type: 'number'
                },
                channel: {
                    type: 'integer'
                },
                averageNoise: {
                    type: 'number'
                },
                stdDevNoise: {
                    type: 'number'
                },
                stations: {
                    type: 'array',
                    items: {
                        $ref: '#/definitions/NewWifiologyMeasurementStation'
                    }
                },
                bssidToNetworkNameMap: {
                    type: 'object'
                },
                serviceSets: {
                    type: 'array',
                    items: {
                        $ref: '#/definitions/NewWifiologyMeasurementServiceSet'
                    }
                },
                extraData: {
                    type: 'object'
                }
            },
            required: [
                'measurementStartTime', 'measurementEndTime', 'measurementDuration',
                'channel', 'stations', 'serviceSets'
            ]
        },
        TestThing: {
            type: 'object',
            description: 'A thing to play with OpenAPI and do a demo.'
        }
    },
    paths: {},
    securityDefinitions: {
        BasicAuth: {
            type: "basic"
        },
        ApiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "X-API-Key"
        }
    }
};

module.exports = {
  apiDoc
};