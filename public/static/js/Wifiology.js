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
                if(serviceSets.hasOwnProperty(networkName)){
                    if(!serviceSets[networkName].bssids.includes(bssid)){
                        serviceSets[networkName].bssids.push(bssid);
                    }
                } else {
                    serviceSets[networkName] = {
                        bssids: [bssid]
                    }
                }
            }
        }
        i = 0;
        for(networkName in serviceSets){
           id = "serviceSetList-" + i;
           i++;

           console.log(networkName, id);
           bssidList = "";
           for(bssid of serviceSets[networkName].bssids){
               bssidList = bssidList.concat(Mustache.render(innerSSTemplate, {bssid: bssid}))
           }

           list.append(
               Mustache.render(
                   outerSSTemplate,
                   {
                       id: id,
                       networkName: networkName,
                       bssidCount: serviceSets[networkName].bssids.length,
                       bssidList: bssidList
                   }
               )
           );
        }
        /*for(var bssid in serviceSets){
            tableBody.append(
                "<tr><td>" +  bssid + "</td><td>" + serviceSets[bssid].networkName + "</td></tr>"
            )
        }*/
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

    function setupAutomaticUpdateBox(){
        var automaticUpdateSelector = $("#automatic-update");
        var timedEvent = null;

        automaticUpdateSelector.click(function(){
            if(timedEvent){
                clearTimeout(timedEvent);
            }
            if(automaticUpdateSelector.clicked){
                timedEvent = setTimeout(function(){
                    populateLatestData(currentChannel);

                }, 30000);
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
        lastRefreshElement = $("#last-refresh-time");
        setupChannelSelector();
        setupAutomaticUpdateBox();
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
    var datasets = null;
    var i = null;
    var currentData = null;
    var currentLabel = null;

    var dontDivideByDuration = [
        'averagePower', 'stdDevPower', 'lowestRate', 'highestRate'
    ];

    function dataExtractorPerSecond(dataCounterName){
        function applicator(datum){
            console.log(datum.measurement.dataCounters);
            return parseInt(datum.measurement.dataCounters[dataCounterName])/datum.measurement.measurementDuration;
        }
        return applicator;
    }

    function dataExtractor(dataCounterName){
        function applicator(datum){
            console.log(datum.measurement.dataCounters);
            return parseFloat(datum.measurement.dataCounters[dataCounterName]);
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

    function generateDatasets(counters){
        datasets = [];
        i = 0;
        for(counter of counters){
            if(dontDivideByDuration.includes(counter)){
                currentData = lastMeasurementData.map(dataExtractor(counter));
                currentLabel = counter;
            } else {
                currentData = lastMeasurementData.map(dataExtractorPerSecond(counter));
                currentLabel = counter + ' per second'
            }
            datasets.push({
                label: currentLabel,
                data: currentData,
                fill: false
            });
            i++;
        }
        return datasets;
    }

    function updateChart(channel){
        cleanupCharts();
        selectedCounters = getSelectedCheckboxValues();
        datasets = generateDatasets(selectedCounters);

        latestDataChart = new Chart(
            $("#node-recent-frame-counts-graph"),
            {
                type: 'line',
                data: {
                    labels: lastMeasurementData.map(generateTimestamp),
                    datasets: datasets
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

    function setupAutomaticUpdateBox(){
        var automaticUpdateSelector = $("#automatic-update");
        var timedEvent = null;

        automaticUpdateSelector.click(function(){
            if(timedEvent){
                clearTimeout(timedEvent);
            }
            if(automaticUpdateSelector.clicked){
                timedEvent = setTimeout(function(){
                    populateLatestData(currentChannel);

                }, 30000);
            }
        });
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
        setupAutomaticUpdateBox();
        populateLatestData();
    });
}