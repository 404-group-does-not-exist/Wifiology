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

    function framesPerSecond(dataCounterName){
        function applicator(datum){
            return parseInt(datum.measurement.dataCounters[dataCounterName])/datum.measurement.measurementDuration;
        }
        return applicator;
    }

    function generateTimestamp(datum){
        let startTime = new Date(datum.measurement.measurementStartTime);
        return startTime.toLocaleTimeString();
    }

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
        var tableBody = $("#service-sets-table tbody");


        tableBody.empty();
        console.log(data);

        for(var i = 0; i < data.length; i++){
            for(var j = 0; j < data[i].serviceSets.length; j++){
                serviceSets[data[i].serviceSets[j].bssid] = data[i].serviceSets[j];
            }
        }
        for(var bssid in serviceSets){
            tableBody.append(
                "<tr><td>" +  bssid + "</td><td>" + serviceSets[bssid].networkName + "</td></tr>"
            )
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
                            labels: data.map(generateTimestamp),
                            datasets: [
                                {
                                    label: 'Management Frame Count Per Second',
                                    data: data.map(framesPerSecond('managementFrameCount')),
                                    borderColor: '#ff6d6d',
                                    fill: false
                                },
                                {
                                    label: 'Data Frame Count Per Second',
                                    data: data.map(framesPerSecond('dataFrameCount')),
                                    borderColor: '#6470ef',
                                    fill: false
                                },
                                {
                                    label: 'Control Frame Count Per Second',
                                    data: data.map(framesPerSecond("controlFrameCount")),
                                    borderColor: '#64ef87',
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
                            labels: data.map(generateTimestamp),
                            datasets: [
                                {
                                    label: 'Throughput B/s',
                                    data: data.map(framesPerSecond('dataThroughputIn')),
                                    borderColor: '#ff6d6d',
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
                            labels: data.map(generateTimestamp),
                            datasets: [
                                {
                                    label: 'Unique Station Count',
                                    data: data.map(uniqueStationCounter),
                                    borderColor: '#6470ef',
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

    function setupAutomaticUpdateBox(){
        var automaticUpdateSelector = $("#automatic-update");
        var timedEvent = null;

        automaticUpdateSelector.click(function(){
            if(timedEvent){
                clearTimeout(timedEvent);
            }
            if(automaticUpdateSelector.clicked){
                timedEvent = setTimeout(function(){populateLatestData(currentChannel)}, 30000);
            }
        });
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
        setupChannelSelector();
        setupAutomaticUpdateBox();
        populateLatestData();
    });
}