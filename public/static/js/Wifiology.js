var wifiologyCommon = {
    dataSetCounterPerSecondExtractor: function(dataCounterName){
        function applicator(datum){
            return wifiologyCommon.counterPerSecondExtractor(dataCounterName, datum.measurement.dataCounters, datum.measurement);
        }
        return applicator;
    },
    counterPerSecondExtractor: function(dataCounterName, counter, measurement){
        return parseInt(counter[dataCounterName] || 0)/measurement.measurementDuration;
    },
    dataSetCounterExtractor: function(dataCounterName){
        function applicator(datum){
            return wifiologyCommon.counterExtractor(dataCounterName, datum.measurement.dataCounters);
        }
        return applicator;
    },
    counterExtractor: function(dataCounterName, counter){
        return parseFloat(counter[dataCounterName] || 0);
    },
    generateTimestampForMeasurement: function(m){
        let startTime = new Date(m.measurementStartTime);
        return startTime.toLocaleTimeString();
    },
    generateTimestamp: function(datum){
        return wifiologyCommon.generateTimestampForMeasurement(datum.measurement);
    },
    generateDataset: function(counter, measurementData, customLabel=null, fill=false){
        var label;
        var data;
        if(wifiologyCommon.dontDivideByDuration.includes(counter)){
            data = measurementData.map(wifiologyCommon.dataSetCounterExtractor(counter));
            label = counter;
        } else {
            data = measurementData.map(wifiologyCommon.dataSetCounterPerSecondExtractor(counter));
            label = counter + ' per second'
        }
        return {
            label: customLabel || label,
            data: data,
            fill: fill
        };
    },
    setupAutomaticUpdateBox: function(selector, populateLatestData, updateTimeout=30000){
        var automaticUpdateSelector = $(selector);
        var timedEvent = null;

        automaticUpdateSelector.click(function(){
            if(timedEvent){
                clearTimeout(timedEvent);
            }
            if(automaticUpdateSelector.clicked){
                timedEvent = setTimeout(function(){
                    populateLatestData();

                }, updateTimeout);
            }
        });
    },
    dontDivideByDuration: [
        'averagePower', 'stdDevPower', 'lowestRate', 'highestRate'
    ]
};


function wifiologyAllSetup(){
    var timer = null;
    var modal = null;

    $(document).ready(function() {
        $(document).ajaxStart(function () {
            modal = $("#wifiology-loading-spinner");
            timer && clearTimeout(timer);
            timer = setTimeout(function(){
                modal.modal('show');
            }, 500);
        });
        $(document).ajaxComplete(function () {
            clearTimeout(timer);
            $("#wifiology-loading-spinner").modal('hide');
        });
    });
}


function wifiologyNodesSetup(){
    $(document).ready(function(){
        $(".nodes-table-datarow").click(function(){
            var nestedLink = $(this).find("a");
            if(nestedLink && nestedLink.attr("href")){
                window.location = nestedLink.attr("href");
            }
        });
    });
}


function wifiologyNodeSetup(nodeID, baseApiUrl){
    var lastMeasurementData = null;
    var currentChannel = null;

    var latestFrameCounts = null;
    var latestThroughPut = null;
    var uniqueStationCount = null;
    var lastRefreshElement = null;

    function uniqueStationCounter(datum){
        return datum.stations.length;
    }

    function cleanupCharts(){
        latestFrameCounts.destroy();
        latestThroughPut.destroy();
        uniqueStationCount.destroy();
    }

    function populateServiceSets(data, channel){
        $("#channel-info").text(channel ? " (Channel " + channel + ") " : " (All Channels) ");
        var serviceSets = {};
        var list = $("#service-sets-list-group");
        var networkName;
        var bssid;
        var bssidList;
        var id;
        var i;
        var outerSSTemplate = $("#ss-item-top-level-template").text();
        var innerSSTemplate = $("#ss-item-bssid-subitem-template").text();

        list.empty();

        for(var i = 0; i < data.length; i++){
            for(var j = 0; j < data[i].serviceSets.length; j++){
                networkName = data[i].serviceSets[j].networkName;
                bssid = data[i].serviceSets[j].bssid;
                if(!serviceSets.hasOwnProperty(networkName)) {
                    serviceSets[networkName] = {}
                }
                serviceSets[networkName][bssid] = {
                    serviceSetID: data[i].serviceSets[j].serviceSetID
                };
            }
        }
        i = 0;
        for(networkName in serviceSets){
           id = "serviceSetList-" + i;
           i++;

           bssidList = "";
           for(bssid of Object.keys(serviceSets[networkName])){
               bssidList = bssidList.concat(
                   Mustache.render(innerSSTemplate, {
                       bssid: bssid,
                       serviceSetID: serviceSets[networkName][bssid].serviceSetID
                   }))
           }

           list.append(
               Mustache.render(
                   outerSSTemplate,
                   {
                       id: id,
                       networkName: networkName,
                       bssidCount: Object.keys(serviceSets[networkName]).length,
                       bssidList: bssidList
                   }
               )
           );
        }
    }


    function populateLatestData(channel=null){
        var measurementsAPI = baseApiUrl + "/nodes/" + nodeID + "/measurements";
        var queryParams = {};
        if(channel){
            queryParams.channel = channel;
        }

        $.getJSON(
            measurementsAPI,
            queryParams,
            function(data){
                data.reverse();
                cleanupCharts();

                latestFrameCounts = new Chart(
                    $("#node-recent-frame-counts-graph"),
                    {
                        type: 'line',
                        data: {
                            labels: data.map(wifiologyCommon.generateTimestamp),
                            datasets: [
                                {
                                    label: 'Management Frame Count Per Second',
                                    data: data.map(wifiologyCommon.dataSetCounterPerSecondExtractor('managementFrameCount')),
                                    borderColor: '#ff6d6d',
                                    pointBorderColor: '#ff3d3d',
                                    pointBackgroundColor: '#ff6d6d',
                                    backgroundColor: '#ff8d8d',
                                    fill: false
                                },
                                {
                                    label: 'Data Frame Count Per Second',
                                    data: data.map(wifiologyCommon.dataSetCounterPerSecondExtractor('dataFrameCount')),
                                    borderColor: '#6470ef',
                                    pointBorderColor: '#5460df',
                                    pointBackgroundColor: '#6470ef',
                                    backgroundColor: '#8490ff',
                                    fill: false
                                },
                                {
                                    label: 'Control Frame Count Per Second',
                                    data: data.map(wifiologyCommon.dataSetCounterPerSecondExtractor("controlFrameCount")),
                                    borderColor: '#64ef87',
                                    pointBorderColor: '#54df77',
                                    pointBackgroundColor: '#64ef87',
                                    backgroundColor: '#84ff97',
                                    fill: false
                                }
                            ],
                        },
                        options: {
                            title: {
                                display: true,
                                responsive: true,
                                text: 'Latest Frame Count Data' + (channel ? ' (Channel ' + channel + ')' : '')
                            }
                        }
                    },


                );

                latestThroughPut = new Chart(
                    $("#node-recent-throughput-graph"),
                    {
                        type: 'line',
                        data: {
                            labels: data.map(wifiologyCommon.generateTimestamp),
                            datasets: [
                                {
                                    label: 'Throughput B/s',
                                    data: data.map(wifiologyCommon.dataSetCounterPerSecondExtractor('dataThroughputIn')),
                                    borderColor: '#ff6d6d',
                                    pointBorderColor: '#ff3d3d',
                                    pointBackgroundColor: '#ff6d6d',
                                    backgroundColor: '#ff8d8d',
                                    fill: true
                                }
                            ],
                        },
                        options: {
                            title: {
                                display: true,
                                responsive: true,
                                text: 'Latest Throughput Data' + (channel ? ' (Channel ' + channel + ')' : '')
                            }
                        }
                    },


                );

                uniqueStationCount = new Chart(
                    $("#node-unique-station-count-graph"),
                    {
                        type: 'line',
                        data: {
                            labels: data.map(wifiologyCommon.generateTimestamp),
                            datasets: [
                                {
                                    label: 'Unique Station Count',
                                    data: data.map(uniqueStationCounter),
                                    borderColor: '#6470ef',
                                    pointBorderColor: '#5460df',
                                    pointBackgroundColor: '#6470ef',
                                    backgroundColor: '#8490ff',
                                    fill: true
                                }
                            ],
                        },
                        options: {
                            title: {
                                display: true,
                                responsive: true,
                                text: 'Unique Station Count ' + (channel ? ' (Channel ' + channel + ')' : '')
                            }
                        }
                    },
                );
                populateServiceSets(data, channel);
                lastRefreshElement.text(" (Last Refresh Time: " + new Date().toLocaleTimeString() + ") ");
                lastMeasurementData = data;
            }
        )
    }

    function setupChannelSelector(){
        var channelSelector = $("#channel-selector");
        channelSelector.change(
            function(){
                var channel = parseInt(channelSelector.val()) || null;
                currentChannel = channel;
                populateLatestData(channel);
            }
        );
    }

    $(document).ready(function(){
        latestFrameCounts = new Chart(
            $("#node-recent-frame-counts-graph"),
            {
                type: 'line'
            }
        );
        latestThroughPut = new Chart(
            $("#node-recent-throughput-graph"),
            {
                type: 'line'
            }
        );
        uniqueStationCount = new Chart(
            $("#node-unique-station-count-graph"),
            {
                type: 'line'
            }
        );
        lastRefreshElement = $("#last-refresh-time");
        setupChannelSelector();
        wifiologyCommon.setupAutomaticUpdateBox(
            "#automatic-update", function(){ populateLatestData(currentChannel) }
        );
        populateLatestData();
    });
}


function wifiologyNodeChartSetup(nodeID, baseApiUrl){
    var lastMeasurementData = null;
    var currentChannel = null;

    var latestDataChart = null;
    var lastRefreshElement = null;
    var dataCounterCheckboxes = null;
    var selectedCounters = null;

    function cleanupCharts(){
        latestDataChart.destroy();
    }

    function getSelectedCheckboxValues(){
        selectedCounters = [];
        dataCounterCheckboxes.find("input").each(
            function(){
                if(this.checked){
                    selectedCounters.push($(this).val())
                }
            }
        );
        console.log(selectedCounters);
        return selectedCounters;
    }

    function updateChart(channel){
        cleanupCharts();
        selectedCounters = getSelectedCheckboxValues();

        latestDataChart = new Chart(
            $("#node-recent-frame-counts-graph"),
            {
                type: 'line',
                data: {
                    labels: lastMeasurementData.map(wifiologyCommon.generateTimestamp),
                    datasets: selectedCounters.map(c  => wifiologyCommon.generateDataset(c, lastMeasurementData))
                },
                options: {
                    title: {
                        display: true,
                        responsive: true,
                        text: 'Latest  Data' + (channel ? ' (Channel ' + channel + ')' : '')
                    },
                    plugins: {
                        colorschemes: {
                            scheme: 'brewer.Paired12'
                        }
                    }
                }
            }
        );
    }

    function populateLatestData(channel=null){
        var measurementsAPI = baseApiUrl + "/nodes/" + nodeID + "/measurements";
        var queryParams = {};
        if(channel){
            queryParams.channel = channel;
        }

        $.getJSON(
            measurementsAPI,
            queryParams,
            function(data){
                data.reverse();
                lastMeasurementData = data;
                updateChart(channel);

                lastRefreshElement.text(" (Last Refresh Time: " + new Date().toLocaleTimeString() + ") ");

            }
        )
    }

    function setupChannelSelector(){
        var channelSelector = $("#channel-selector");
        channelSelector.change(
            function(){
                var channel = parseInt(channelSelector.val()) || null;
                currentChannel = channel;
                populateLatestData(channel);
            }
        );
    }

    $(document).ready(function(){
        latestDataChart = new Chart(
            $("#node-recent-frame-counts-graph"),
            {
                type: 'line'
            }
        );
        dataCounterCheckboxes = $("#data-counters-selectors");

        $("#data-counters-selectors input").on("click", function(){
           updateChart(currentChannel)
        });

        lastRefreshElement = $("#last-refresh-time");
        setupChannelSelector();
        wifiologyCommon.setupAutomaticUpdateBox(
            "#automatic-update", function(){ populateLatestData(currentChannel) }
        );
        populateLatestData();
    });
}


function wifiologyUserSetup(viewingUserID, runningAsUserID, baseApiUrl){
    var keyCreationForm;
    var apiKeysTable;
    var apiKeysTableBody;
    var keyID;

    function setupKeyCreationForm(){
        keyCreationForm = $("#createApiKeyForm");
        if(keyCreationForm){
            keyCreationForm.submit(function(e){
                e.preventDefault();
                $.post({
                    type: "POST",
                    url: keyCreationForm.attr("action"),
                    data: $(this).serialize(),
                    success: function(resp){
                        apiKeysTableBody.append(
                            "<tr id=\"key-row-" + resp.info.apiKeyID + "\"><td>"
                            + resp.info.apiKeyID + "</td><td>" + resp.info.apiKeyDescription + "</td>"
                            + "<td>" + (resp.info.apiKeyExpiry || "None") + "</td>"
                            + "<td><button data-keyID=\"" + resp.info.apiKeyID
                            + "\" class=\"btn btn-danger btn-block delete-key-button\">Delete</button></td>"
                        );
                        $("#keyCreationModalKeyValue").val(resp.key);
                        $("#keyCreationModal").modal(
                            "show"
                        );
                        setupKeyDeletion();
                    }
                })
            });
        }
    }

    function setupKeyDeletion(){
        $(".delete-key-button").on("click", function(){
            keyID = $(this).attr("data-keyID");
            $.post({
                type: "DELETE",
                url: baseApiUrl + "/users/apiKey/" + keyID,
                success: function(resp){
                    $("#key-row-" + keyID).remove();
                }
            })
        });
    }

    $(document).ready(function(){
        apiKeysTable = $("#apiKeysTable");
        apiKeysTableBody = $("#apiKeysTable tbody");
        keyCreationForm = $("#createApiKeyForm");
        setupKeyCreationForm();
        setupKeyDeletion();
    });
}


function wifiologyServiceSetSetup(serviceSetID, baseApiUrl){
    var latestFrameCounts;
    var latestThroughput;
    var uniqueStationCount;
    var lastRefreshElement;
    var infraDeviceManufacturerChart;
    var associatedDeviceManufacturerChart;
    var channelsElement;
    var channels;
    var latestData = null;

    function populateLatestData(){
        var dataAPI = baseApiUrl + "/serviceSets/" + serviceSetID + "/measurements";
        $.getJSON(
            dataAPI,
            {},
            function(data){
                console.log(data);
                latestData = data;
                cleanupCharts();
                updateLatestFrameCountsChart(data);
                updateThroughputChart(data);
                updateUniqueStationsChart(data);
                updateChannels(data);
                updateManufacturerCharts(data);
                lastRefreshElement.text(" (Last Refresh Time: " + new Date().toLocaleTimeString() + ") ");
            }
        );
    }

    function cleanupCharts(){
        latestFrameCounts.destroy();
        latestThroughput.destroy();
        uniqueStationCount.destroy();
        infraDeviceManufacturerChart.destroy();
        associatedDeviceManufacturerChart.destroy();
    }

    function updateChannels(data){
        var i;
        var channel;
        channelsElement.empty();
        channels = [];
        for(i = 0; i < data.measurements.length; i++){
            channel = parseInt(data.measurements[i].channel);
            if(!channels.includes(channel)){
                channels.push(channel);
            }
        }
        channels.sort();
        for(i = 0; i < channels.length; i++){
            if(i === 0){
                channelsElement.append(channels[i])
            } else {
                channelsElement.append(", " + channels[i]);
            }
        }
    }

    function updateManufacturerCharts(data){
        infraDeviceManufacturerChart = new Chart(
            $("#service-set-infra-device-manufacturer-chart"),
            {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: Object.values(data.infrastructureMacAddressManufacturerCounts)
                    }],
                    labels: Object.keys(data.infrastructureMacAddressManufacturerCounts)
                },
                options: {
                    title: {
                        display: true,
                        responsive: true,
                        text: 'Infrastructure Devices By Manufacturer'
                    }
                }
            }
        );
        associatedDeviceManufacturerChart = new Chart(
            $("#service-set-associated-device-manufacturer-chart"),
            {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: Object.values(data.associatedMacAddressManufacturerCounts)
                    }],
                    labels: Object.keys(data.associatedMacAddressManufacturerCounts)
                },
                options: {
                    title: {
                        display: true,
                        responsive: true,
                        text: 'Associated Devices By Manufacturer'
                    }
                }
            }
        );
    }

    function updateLatestFrameCountsChart(data){
        function extractCounters(counterName){
            return data.measurements.map(function(m){
                return wifiologyCommon.counterPerSecondExtractor(counterName, data.associatedStationsDataCounters[parseInt(m.measurementID)] || {}, m)
                    + wifiologyCommon.counterPerSecondExtractor(counterName, data.infrastructureDataCounters[parseInt(m.measurementID)] || {}, m);
            });
        }


        latestFrameCounts = new Chart(
            $("#service-set-recent-frame-counts-graph"),
            {
                type: 'line',
                data: {
                    labels: data.measurements.map(wifiologyCommon.generateTimestampForMeasurement),
                    datasets: [
                        {
                            label: 'Management Frame Count Per Second',
                            data: extractCounters('managementFrameCount'),
                            borderColor: '#ff6d6d',
                            pointBorderColor: '#ff3d3d',
                            pointBackgroundColor: '#ff6d6d',
                            backgroundColor: '#ff8d8d',
                            fill: false
                        },
                        {
                            label: 'Data Frame Count Per Second',
                            data: extractCounters('dataFrameCount'),
                            borderColor: '#6470ef',
                            pointBorderColor: '#5460df',
                            pointBackgroundColor: '#6470ef',
                            backgroundColor: '#8490ff',
                            fill: false
                        },
                        {
                            label: 'Control Frame Count Per Second',
                            data: extractCounters("controlFrameCount"),
                            borderColor: '#64ef87',
                            pointBorderColor: '#54df77',
                            pointBackgroundColor: '#64ef87',
                            backgroundColor: '#84ff97',
                            fill: false
                        }
                    ],
                },
                options: {
                    title: {
                        display: true,
                        responsive: true,
                        text: 'Latest Frame Count Data'
                    }
                }
            },

        );
    }

    function updateThroughputChart(data){
        function extractCounters(counterName){
            return data.measurements.map(function(m){
                return wifiologyCommon.counterPerSecondExtractor(counterName, data.associatedStationsDataCounters[parseInt(m.measurementID)] || {}, m)
                    + wifiologyCommon.counterPerSecondExtractor(counterName, data.infrastructureDataCounters[parseInt(m.measurementID)] || {}, m);
            });
        }

        latestThroughput = new Chart(
            $("#service-set-recent-throughput-graph"),
            {
                type: 'line',
                data: {
                    labels: data.measurements.map(wifiologyCommon.generateTimestampForMeasurement),
                    datasets: [
                        {
                            label: 'Throughput B/s',
                            data: extractCounters('dataThroughputIn'),
                            borderColor: '#ff6d6d',
                            pointBorderColor: '#ff3d3d',
                            pointBackgroundColor: '#ff6d6d',
                            backgroundColor: '#ff8d8d',
                            fill: true
                        }
                    ],
                },
                options: {
                    title: {
                        display: true,
                        responsive: true,
                        text: 'Latest Throughput Data'
                    }
                }
            },


        );
    }

    function updateUniqueStationsChart(data){
        function extractUniqueStationsCount(key){
            return data.measurements.map(
                function(m){
                    return (data[key][parseInt(m.measurementID)] || []).length
                }
            )
        }
        uniqueStationCount = new Chart(
            $("#service-set-unique-associated-station-graph"),
            {
                type: 'line',
                data: {
                    labels: data.measurements.map(wifiologyCommon.generateTimestampForMeasurement),
                    datasets: [
                        {
                            label: 'Unique Associated Station Count',
                            data: extractUniqueStationsCount('associatedMacAddresses'),
                            borderColor: '#6470ef',
                            pointBorderColor: '#5460df',
                            pointBackgroundColor: '#6470ef',
                            backgroundColor: '#8490ff',
                            fill: false
                        },
                        {
                            label: 'Unique Infrastructure Station Count',
                            data: extractUniqueStationsCount('infrastructureMacAddresses'),
                            borderColor: '#ff6d6d',
                            pointBorderColor: '#ff3d3d',
                            pointBackgroundColor: '#ff6d6d',
                            backgroundColor: '#ff8d8d',
                            fill: false
                        }
                    ],
                },
                options: {
                    title: {
                        display: true,
                        responsive: true,
                        text: 'Unique Station Count'
                    }
                }
            },
        );
    }

    $(document).ready(function(){
        latestFrameCounts = new Chart(
            $("#service-set-recent-frame-counts-graph"),
            {
                type: 'line'
            }
        );
        latestThroughput = new Chart(
            $("#service-set-recent-throughput-graph"),
            {
                type: 'line'
            }
        );
        uniqueStationCount = new Chart(
            $("#service-set-unique-associated-station-graph"),
            {
                type: 'line'
            }
        );
        infraDeviceManufacturerChart = new Chart(
            $("#service-set-infra-device-manufacturer-chart"),
            {
                type: 'doughnut'
            }
        );
        associatedDeviceManufacturerChart = new Chart(
            $("#service-set-associated-device-manufacturer-chart"),
            {
                type: 'doughnut'
            }
        );
        lastRefreshElement = $("#last-refresh-time");
        channelsElement = $("#channels-info");
        wifiologyCommon.setupAutomaticUpdateBox("#automatic-update", populateLatestData);
        populateLatestData();
    });
}