//Call to html to query airtable and create charts
function makeCharts() {

    // Access airtable api
    var Airtable = require('airtable');
    var base = new Airtable({ apiKey: 'keyp7HCy56rjxwnQp' }).base('appxE35JcMxUkJeTy');
    var allRecords = [];

    base('Tickets and Requests').select({
        view: "Grid view"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
        // Push all record fields to array
        records.forEach(function(record) {
            allRecords.push(record.fields);
        });

        // To fetch the next page of records
        fetchNextPage();

    }, function done(err) {
        if (err) { console.error(err); return; }
        else {


            $(function() {
                $('input[name="daterange"]').daterangepicker({
                    opens: 'left'
                }, function(start, end, label) {
                    console.log("A new date selection was made: " + start.format('MM-DD-YYYY') + ' to ' + end.format('MM-DD-YYYY'));
                    var tableTitle = document.getElementById('tabletitle')
                    tableTitle.innerHTML = start.format('MM-DD-YYYY') + ' - ' + end.format('MM-DD-YYYY')
                });
            });



            // Programming hours
            var allRecordsProgrammingTime = []
            for (var i = 0; i < allRecords.length; i++) {
                if (allRecords[i]['Programming Hours'] != undefined) {
                    allRecordsProgrammingTime.push(allRecords[i]['Programming Hours'])
                }
            }

            const sum = allRecordsProgrammingTime.reduce((total, amount) => total + amount);
            var programmingTime = secondsToHrs(sum)
            var pt = document.getElementById('programmingtime')
            pt.innerHTML = programmingTime

            // Sort data for completed by bar chart all agencies all time
            var completed_by_all_time = [];
            for (var i = 0; i < allRecords.length; i++) {
                completed_by_all_time.push(allRecords[i]['Completed By']);
            }
            var counted = count(completed_by_all_time);
            delete counted.undefined;
            var names_all_time = Object.keys(counted);
            var number_completed_all_time = Object.values(counted);
            var number_completed_yearly = completedBy(allRecords, 365)
            var number_completed_monthly = completedBy(allRecords, 30)
            var number_completed_weekly = completedBy(allRecords, 7)
            // Sort data for completion dates all agencies all time
            var dateData = []
            for (var i = 0; i < allRecords.length; i++) {
                dateData.push([allRecords[i]['Request Date'],
                    allRecords[i]['Completion Date']
                ])

            }
            var threePlus = 0
            var twoDays = 0
            var oneDay = 0
            var sameDay = 0
            var open = 0

            for (var i = 0; i < dateData.length; i++) {
                if (allRecords[i]['Request Date'] === undefined || allRecords[i]['Completion Date'] === undefined) {
                    open++
                }
                else {

                    var requestdate = moment(dateData[i][0])
                    var completiondate = moment(dateData[i][1])
                    if (completiondate.diff(requestdate, 'day') >= 3) {
                        threePlus++
                    }
                    else if (completiondate.diff(requestdate, 'day') >= 2) {
                        twoDays++
                    }
                    else if (completiondate.diff(requestdate, 'day') >= 1) {
                        oneDay++
                    }
                    else {
                        sameDay++
                    }
                }
            }

            var daysArrayAllTime = []
            daysArrayAllTime.push(sameDay, oneDay, twoDays, threePlus)
            var daysArrayYearly = completionTime(allRecords, 365)
            var daysArrayMonthly = completionTime(allRecords, 30)
            var daysArrayWeekly = completionTime(allRecords, 7)


            // Update open tickets all all agencies
            var opentickets = document.getElementById("opentickets")
            opentickets.innerHTML = open
            open.innerHTML = open


            // Sort Data for agency pie chart all time
            var requested_by = [];
            for (var i = 0; i < allRecords.length; i++) {
                requested_by.push(allRecords[i]['Agency-Division']);
            }
            var agenciesCounted = count(requested_by);
            delete agenciesCounted.undefined;
            var resultArray = Object.entries(agenciesCounted);
            var agenciesSorted = resultArray.sort(function(a, b) {
                return a[1] < b[1] ? 1 : -1;
            });

            var agencyName = [];
            var agencyCount = [];
            for (i = 0; i < agenciesSorted.length; i++) {
                agencyCount.push(agenciesSorted[i][1]);
                agencyName.push(agenciesSorted[i][0]);
            }

            var topTenName = agencyName.slice(0, 10)
            var topTenCount = agencyCount.slice(0, 10)



            // data for dropdown
            var agencyNameAlpha = agencyName.sort()
            var sel = document.getElementById('agencies');
            for (var i = 0; i < agencyNameAlpha.length; i++) {
                var opt = document.createElement('option');
                opt.innerHTML = agencyNameAlpha[i];
                opt.value = agencyNameAlpha[i];
                sel.appendChild(opt);
            }



            // Make a bar for completed by all time
            var barChart = document.getElementById('bar-chart').getContext('2d');
            /*global Chart*/
            var chart = new Chart(barChart, {
                // The type of chart we want to create
                type: 'bar',

                // The data for our dataset
                data: {
                    labels: names_all_time,
                    datasets: [{
                            label: "Weekly",
                            backgroundColor: '#69779b',
                            data: number_completed_weekly,

                        }, {
                            label: "Monthly",
                            data: number_completed_monthly,
                            backgroundColor: '#a1dd70'

                        },
                        {
                            label: "Yearly",
                            data: number_completed_yearly,
                            backgroundColor: '#a23131'

                        },
                        {
                            label: "All Time",
                            data: number_completed_all_time,
                            backgroundColor: '#005995'

                        }
                    ],
                },

                // Configuration options go here
                options: {
                    title: {
                        display: true,
                        text: 'Service Tickets Completed'
                    },
                    legend: {
                        display: true
                    },
                    scales: {
                        yAxes: [{
                            display: true,
                            ticks: {
                                beginAtZero: true,
                                suggestedMax: 10,
                            }
                        }],
                        xAxes: [{
                            barPercentage: 0.3,
                            categoryPercentage: 1
                        }]
                    }
                }

            });


            // Create agency bar chart all time
            var agencyPieCx = document.getElementById('agencyPie').getContext('2d');
            var agencyPieChart = new Chart(agencyPieCx, {

                type: 'pie',

                data: {
                    labels: topTenName,
                    datasets: [{
                        label: "Service Requests",
                        data: topTenCount,
                        backgroundColor: ['#005995', '#a23131', '#a1dd70', '#e8ecd6', '#f67280', '#35477d', '#51eaea', '#e88a1a', '#f8a978', '#970690']

                    }],
                },

                options: {
                    title: {
                        display: true,
                        text: 'Top 10 Departments/Agencies by Request All Time'
                    },
                    legend: {
                        display: false
                    },
                    scales: {
                        xAxes: [{
                            gridLines: {
                                display: false
                            },
                            ticks: {
                                autoSkip: false,
                                display: false
                            }
                        }]
                    }
                }
            });

            // Create completion time pie chart all time
            var timeFramePie = document.getElementById('timeFramePie').getContext('2d');
            var timePie = new Chart(timeFramePie, {

                type: 'bar',
                // The data for our dataset
                data: {
                    labels: ["Same Day", "1 Day", "2 Days", "3+ Days"],
                    datasets: [{
                            label: "Weekly",
                            data: daysArrayWeekly,
                            backgroundColor: '#69779b'

                        }, {
                            label: "Monthly",
                            data: daysArrayMonthly,
                            backgroundColor: '#a1dd70'

                        }, {
                            label: "Yearly",
                            data: daysArrayYearly,
                            backgroundColor: '#a23131'

                        },
                        {
                            label: "All Time",
                            data: daysArrayAllTime,
                            backgroundColor: '#005995'

                        }
                    ],
                },

                // Configuration options go here
                options: {

                    title: {
                        display: true,
                        text: 'Days to Completion'
                    },
                    legend: {
                        display: true
                    },
                    scales: {
                        xAxes: [{
                            gridLines: {
                                display: true
                            },
                            ticks: {
                                autoSkip: false,
                                display: true,
                                suggestedMax: 10,
                            }
                        }],
                        yAxes: [{
                            display: true,
                            ticks: {
                                beginAtZero: true,
                                suggestedMax: 10,
                            }
                        }]
                    }
                }
            });


            // update charts and data on agency selection
            document.getElementById("agencies").onchange = function() {

                var agencyRecord = []
                if (this.value === "All Departments and Agencies") {
                    addData(chart, names_all_time, number_completed_weekly, number_completed_monthly, number_completed_yearly, number_completed_all_time)
                    addDatanoLabels(timePie, daysArrayWeekly, daysArrayMonthly, daysArrayYearly, daysArrayAllTime)
                    opentickets.innerHTML = open
                    pt.innerHTML = programmingTime
                }
                else {


                    // Data for completed by on select
                    for (var i = 0; i < allRecords.length; i++) {
                        if (allRecords[i]['Agency-Division'] === this.value) {
                            agencyRecord.push(allRecords[i])
                        }
                    }

                    var allRecordsProgrammingTime_agency = []
                    for (var i = 0; i < agencyRecord.length; i++) {
                        if (agencyRecord[i]['Programming Hours'] != undefined) {
                            allRecordsProgrammingTime_agency.push(agencyRecord[i]['Programming Hours'])
                        }
                    }

                    // Programming hours
                    const sum_agency = allRecordsProgrammingTime_agency.reduce((total, amount) => total + amount);
                    var programmingTime_agency = secondsToHrs(sum_agency)
                    pt.innerHTML = programmingTime_agency


                    // Sort data for completed by bar chart
                    var completed_by_agency = []
                    for (var i = 0; i < agencyRecord.length; i++) {
                        completed_by_agency.push(agencyRecord[i]['Completed By']);
                    }
                    var counted2 = count(completed_by_agency);
                    delete counted2.undefined;
                    var names_by_agency = Object.keys(counted2);
                    var number_completed_by_agency = Object.values(counted2);
                    var number_completed_yearly_agency = completedBy_agency(agencyRecord, 365, names_by_agency)
                    var number_completed_monthly_agency = completedBy_agency(agencyRecord, 30, names_by_agency)
                    var number_completed_weekly_agency = completedBy_agency(agencyRecord, 7, names_by_agency)
                    addData(chart, names_by_agency, number_completed_weekly_agency, number_completed_monthly_agency, number_completed_yearly_agency, number_completed_by_agency)

                    // Sort Data for completion time
                    var dateData = []
                    for (var i = 0; i < agencyRecord.length; i++) {
                        dateData.push([agencyRecord[i]['Request Date'],
                            agencyRecord[i]['Completion Date']
                        ])

                    }

                    var threePlus_agency = 0
                    var twoDays_agency = 0
                    var oneDay_agency = 0
                    var sameDay_agency = 0
                    var open_agency = 0

                    for (var i = 0; i < dateData.length; i++) {
                        if (agencyRecord[i]['Request Date'] === undefined || agencyRecord[i]['Completion Date'] === undefined) {
                            open_agency++
                        }
                        else {

                            var requestdate = moment(dateData[i][0])
                            var completiondate = moment(dateData[i][1])
                            if (completiondate.diff(requestdate, 'day') >= 3) {
                                threePlus_agency++
                            }
                            else if (completiondate.diff(requestdate, 'day') >= 2) {
                                twoDays_agency++
                            }
                            else if (completiondate.diff(requestdate, 'day') >= 1) {
                                oneDay_agency++
                            }
                            else {
                                sameDay_agency++
                            }
                        }
                    }

                    // Display open tickets per agency
                    opentickets.innerHTML = open_agency
                    var daysArrayAllTime_agency = []

                    daysArrayAllTime_agency.push(sameDay_agency, oneDay_agency, twoDays_agency, threePlus_agency)
                    var daysArrayYearly_agency = completionTime(agencyRecord, 365)
                    var daysArrayMonthly_agency = completionTime(agencyRecord, 30)
                    var daysArrayWeekly_agency = completionTime(agencyRecord, 7)
                    addDatanoLabels(timePie, daysArrayWeekly_agency, daysArrayMonthly_agency, daysArrayYearly_agency, daysArrayAllTime_agency)

                }
            };


        }
    });
}

// HELPER FUNCTIONS

function addData(chart, labels, dataWeekly, dataMonthly, dataYearly, dataAllTime) {
    chart.data.labels = labels
    chart.data.datasets[0].data = dataWeekly
    chart.data.datasets[1].data = dataMonthly
    chart.data.datasets[2].data = dataYearly
    chart.data.datasets[3].data = dataAllTime
    chart.update()
}



function addDatanoLabels(chart, dataWeekly, dataMonthly, dataYearly, dataAllTime) {
    chart.data.datasets[0].data = dataWeekly
    chart.data.datasets[1].data = dataMonthly
    chart.data.datasets[2].data = dataYearly
    chart.data.datasets[3].data = dataAllTime
    chart.update()
}



function completionTime(array, length) {
    var allRecords = []
    for (var i = 0; i < array.length; i++) {
        if (array[i]['Request Date'] === undefined) {
            array[i]['Request Date'] = "2019-01-01"
        }

        var now = moment()
        var allRequests = moment(array[i]["Request Date"])
        if (now.diff(allRequests, 'day') <= length) {
            allRecords.push(array[i])
        }
    }

    var dateData = []
    for (var i = 0; i < allRecords.length; i++) {
        dateData.push([allRecords[i]['Request Date'],
            allRecords[i]['Completion Date']
        ])

    }

    var threePlus = 0
    var twoDays = 0
    var oneDay = 0
    var sameDay = 0
    var open = 0

    for (var i = 0; i < dateData.length; i++) {
        if (array[i]['Request Date'] === undefined || array[i]['Completion Date'] === undefined) {
            open++
        }
        else {

            var requestdate = moment(dateData[i][0])
            var completiondate = moment(dateData[i][1])
            if (completiondate.diff(requestdate, 'day') >= 3) {
                threePlus++
            }
            else if (completiondate.diff(requestdate, 'day') >= 2) {
                twoDays++
            }
            else if (completiondate.diff(requestdate, 'day') >= 1) {
                oneDay++
            }
            else {
                sameDay++
            }
        }
    }


    var daysArray = []
    daysArray.push(sameDay, oneDay, twoDays, threePlus)
    return daysArray
}

function completedBy_agency(array, length, completedByNamesArray_agency) {
    // Sort data for completed by bar chart all agencies yearly
    var allRecords = []
    for (var i = 0; i < array.length; i++) {
        if (array[i]['Request Date'] === undefined) {
            array[i]['Request Date'] = "2019-01-01"
        }

        var now = moment()
        var allRequests = moment(array[i]["Request Date"])
        if (now.diff(allRequests, 'day') <= length) {
            allRecords.push(array[i])
        }
    }

    var completed_by = [];
    for (var i = 0; i < allRecords.length; i++) {
        completed_by.push(allRecords[i]['Completed By']);
    }


    var counted = count(completed_by);
    delete counted.undefined;
    var names = Object.keys(counted);
    var number_completed = Object.values(counted);

    while (number_completed.length < completedByNamesArray_agency.length) {
        if (number_completed.length < completedByNamesArray_agency.length) {
            number_completed.unshift(0)
        }
    }

    return number_completed
}

function count(array) {
    var arr = array;
    var result = {};
    for (var i = 0; i < arr.length; ++i) {
        if (!result[arr[i]])
            result[arr[i]] = 0;
        ++result[arr[i]];
    }
    return result;
}

function completedBy(array, length) {
    // Sort data for completed by bar chart all agencies yearly
    var allRecords = []
    for (var i = 0; i < array.length; i++) {
        if (array[i]['Request Date'] === undefined) {
            array[i]['Request Date'] = "2019-01-01"
        }

        var now = moment()
        var allRequests = moment(array[i]["Request Date"])
        if (now.diff(allRequests, 'day') <= length) {
            allRecords.push(array[i])
        }
    }

    var completed_by = [];
    for (var i = 0; i < allRecords.length; i++) {
        completed_by.push(allRecords[i]['Completed By']);
    }


    var counted = count(completed_by);
    delete counted.undefined;
    var names = Object.keys(counted);
    var number_completed = Object.values(counted);


    return number_completed
}

function secondsToHrs(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    var hDisplay = h + ":" + m;
    return hDisplay;
}
