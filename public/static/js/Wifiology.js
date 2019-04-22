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


    function populateLatestDataChart(channel=null){
        var latestFrameCounts = new Chart(
            $("#node-recent-frame-counts-graph"),
            {
                type: 'line'
            }
        );
        var latestThroughPut = new Chart(
            $("#node-recent-throughput-graph"),
            {
                type: 'line'
            }
        );
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
                latestFrameCounts.destroy();
                latestThroughPut.destroy();

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

                latestFrameCounts = new Chart(
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
            }
        )
    }

    function setupChannelSelector(){
        var channelSelector = $("#channel-selector");
        channelSelector.change(
            function(){
                let channel = parseInt(channelSelector.val()) || null;
                populateLatestDataChart(channel);
            }
        );
    }

    $(document).ready(function(){
        setupChannelSelector();
        populateLatestDataChart();

    });
}