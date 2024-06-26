let issuesChart;
let ratingChart;
let sentimentChart;
let toxicityChart;
let packageSmellsChart;
let methodSmellsChart;
let classSmellsChart
let issuesDistChart;
let selectedVersions = [];
let selectedIssues = [];
let allVersions = [];
let allReviews = [];
let allData = [];


$(document).ready(function() {
    // load the reviews for Antenna Pod
    $.getJSON("Applications_Reviews.json", function(reviews) {
        allReviews = reviews;
        renderReviews(reviews);
    });

    $.getJSON("data.json", function(jsonData) {
        allData = jsonData;
        allVersions = allData['AntennaPod']['versions'];
        allVersions.forEach(version => {
            // append a new li for each version
            let text = `<li><label><input type="checkbox" value="${version}">Version ${version}</label></li>`
            $('#versions').append(text);
        });
        render(jsonData['AntennaPod']);
    });
});

$("#myTable").DataTable({
    fixedColumns: true,
    scrollCollapse: true,
    scrollX: true,
    scrollY: "300px",
    data: [],
    columns: [
        { data: 'content', title: 'Review'},
        {data: 'score', title: 'Score'},
        {data: 'sentiment', title: 'Sentiment'},
        {data: 'toxicity', title: 'Toxicity'},
        {data: 'reviewCreatedVersion', title: 'Version'},
        // {data: 'at', title: 'Date'},
    ],
    "order": [[ 5, "desc" ]],
    "pageLength": 10,
    "columnDefs": [ 
        {
            "targets": 0,
            "width": "40%",
            "render": function ( data, type, row, meta ) { 
                let text = data;
            
                if(text && text.length > 100){
                    text = text.substring(0, 100) + '...';
                }
                return '<a target="_blank" href="https://play.google.com/store/apps/details?id=de.danoeh.antennapod&reviewId=' + row.reviewId + '">' + text + '</a>';
            }
        },
        {
            "targets": 1,
            "render": function ( data, type, row, meta ) {
                if(type == "display"){
                    var stars = '';
                    // add bi stars filled with the score, and one and half if the score is not an integer and empty for the rest
                    for (let i = 0; i < 5; i++) {
                        if (i < data) {
                            stars += '<i class="bi bi-star-fill"></i>';
                        } else if (i === Math.floor(data) && i !== data) {
                            stars += '<i class="bi bi-star-half"></i>';
                        } else {
                            stars += '<i class="bi bi-star"></i>';
                        }
                    }
                    return stars;
                }
                return data;
            }
        },
        {
            "targets": 2,
            "render": function ( data, type, row, meta ) {
                if(type == "display"){
                    if(data > 0){
                        return '<i class="bi bi-emoji-smile"></i>';
                    } else if(data < 0){
                        return '<i class="bi bi-emoji-frown"></i>';
                    } else {
                        return '<i class="bi bi-emoji-neutral"></i>';
                    }
                }
                return data;
            }
        },
        {
            "targets": 3,
            "render": function ( data, type, row, meta ) {
                if(type == "display"){
                    if(data > 0.5){
                        return '<i class="bi bi-emoji-angry"></i>';
                    } else {
                        return '<i class="bi bi-emoji-laughing"></i>';
                    }
                }
                return data;
            }
        },

    ]
});

function renderReviews(reviews){
    // fill the table with the reviews
    let appReviews = reviews.filter((item) => item.app_name === 'Antenna Pod');
    $('#myTable').DataTable().clear().rows.add(appReviews).draw(); 
}

function render(appData){
    $('#sentiment').text((appData['sentiment'].reduce((acc, item) => acc + item, 0) / appData['sentiment'].length).toFixed(2));
    $('#toxicity').text((appData['toxicity'].reduce((acc, item) => acc + item, 0) / appData['toxicity'].length).toFixed(2));
    $('#rating').text((appData['rating'].reduce((acc, item) => acc + item, 0) / appData['rating'].length).toFixed(2));
    let issueCount = 0;
    issueCount += appData['crashes'].reduce((acc, item) => acc + item, 0);
    issueCount += appData['performance'].reduce((acc, item) => acc + item, 0);
    issueCount += appData['design'].reduce((acc, item) => acc + item, 0);
    issueCount += appData['functionality'].reduce((acc, item) => acc + item, 0);
    issueCount += appData['security'].reduce((acc, item) => acc + item, 0);
    issueCount += appData['userExperience'].reduce((acc, item) => acc + item, 0);
    issueCount += appData['developerRelated'].reduce((acc, item) => acc + item, 0);
    $('#issuesCount').text(issueCount);
    
    // create the chart
    createIssuesDistributionChart(appData);
    createChart(appData);
    createArtifactsCharts(appData);
    createPackageSmellsChart(appData);
    createMethodSmellsChart(appData);
    createClassSmellsChart(appData);
}

$('.allow-focus').on('click', function(event) {
    event.stopPropagation();
 });


$("#versions").on("change", "input[type='checkbox']", function() {
    $(this).closest("li").toggleClass("active", this.checked);
    // get the value of selected checkboxesW
    selectedVersions = [];
    $("#versions input:checked").each(function() {
        selectedVersions.push($(this).val());
    });
    
    filterData(selectedVersions, selectedIssues);
 });

 $("#issues").on("change", "input[type='checkbox']", function() {
    $(this).closest("li").toggleClass("active", this.checked);
    // get the value of selected checkboxesW
    selectedIssues = [];
    $("#issues input:checked").each(function() {
        selectedIssues.push($(this).val());
    });
    
    filterData(selectedVersions, selectedIssues);
 });

function filterData(versions, issues){
    let filteredData = allData['AntennaPod'];
    if(versions.length > 0){
        filteredData = filterVersions(filteredData, versions);
    }
    if(issues.length > 0){
        filteredData = filterIssues(filteredData, issues);
    }
    render(filteredData);
}

function filterVersions(data, versions){
    let filteredData = {};
    filteredData['versions'] = versions;
    filteredData['dates'] = versions.map((version) => data["dates"][data['versions'].indexOf(version)]);
    filteredData['rating'] = versions.map((version) => data['rating'][data['versions'].indexOf(version)]);
    filteredData['sentiment'] = versions.map((version) => data['sentiment'][data['versions'].indexOf(version)]);
    filteredData['toxicity'] = versions.map((version) => data['toxicity'][data['versions'].indexOf(version)]);
    filteredData['crashes'] = versions.map((version) => data['crashes'][data['versions'].indexOf(version)]);
    filteredData['performance'] = versions.map((version) => data['performance'][data['versions'].indexOf(version)]);
    filteredData['design'] = versions.map((version) => data['design'][data['versions'].indexOf(version)]);
    filteredData['functionality'] = versions.map((version) => data['functionality'][data['versions'].indexOf(version)]);
    filteredData['security'] = versions.map((version) => data['security'][data['versions'].indexOf(version)]);
    filteredData['userExperience'] = versions.map((version) => data['userExperience'][data['versions'].indexOf(version)]);
    filteredData['developerRelated'] = versions.map((version) => data['developerRelated'][data['versions'].indexOf(version)]);
    filteredData['packageSmells'] = versions.map((version) => data['packageSmells'][data['versions'].indexOf(version)]);
    filteredData['methodSmells'] = versions.map((version) => data['methodSmells'][data['versions'].indexOf(version)]);
    filteredData['classSmells'] = versions.map((version) => data['classSmells'][data['versions'].indexOf(version)]);
    return filteredData;
}


function createIssuesDistributionChart(data){
    let issuesDistributionCtx = document.getElementById('issuesDistChart');

    let labels = ['crashes', 'performance', 'design', 'functionality', 'security', 'userExperience', 'developerRelated'];
    let chartData = labels.map((label) => {
        return data[label].reduce((acc, item) => acc + item, 0);
    });


    let datasets = [{
        label: 'Types of issues',
        data: chartData,
        borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(25, 19, 132, 1)',
            'rgba(255, 9, 132, 1)'
        ],
        backgroundColor: [
            'rgba(54, 162, 235, 0.4)',
            'rgba(255, 206, 86, 0.4)',
            'rgba(75, 192, 192, 0.4)',
            'rgba(153, 102, 255, 0.4)',
            'rgba(255, 159, 64, 0.4)',
            'rgba(25, 19, 132, 0.4)',
            'rgba(255, 9, 132, 0.4)',
        ]
    }];

    let config = {
        type: 'polarArea',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            interaction:{
                mode: 'nearest',
                intersect: false,
            },
            scales:{
                r:{
                    pointLabels:{
                        display: true,
                        centerPointLabels: true,
                        font: {
                            size: 18,
                        }
                    }
                }
            },
            plugins: {
              legend: {
                position: 'top',
                labels:{
                    font: {
                        size: 16,
                    }
                }
              },
              title: {
                display: true,
                text: 'Issues distribution',
                font: {
                    size: 20,
                }
              }
            }
        }
    }
    console.log("creating a new chart");
    if(issuesDistChart != undefined){
        issuesDistChart.destroy();
    }
    issuesDistChart = new Chart(issuesDistributionCtx, config);
}

function createChart(data) {
    let issuesCtx = document.getElementById('issuesChart');

    if(issuesChart != undefined){
        issuesChart.destroy();
    }

    let labels = data['versions']
    // match labels to dates
    let dates = data['dates']

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Crashing Issues',
                data: data['crashes'],
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
            },
            {
                label: 'Performance Issues',
                data: data['performance'],
                borderColor: 'rgba(255, 206, 86, 1)',
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
            },
            {
                label: 'UI / Design Issues',
                data: data['design'],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
            },
            {
                label: 'Functionality Issues',
                data: data['functionality'],
                borderColor: 'rgba(153, 102, 255, 1)',
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
            },
            {
                label: 'Security Related Issues',
                data: data['security'],
                borderColor: 'rgba(255, 159, 64, 1)',
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
            },
            {
                label: 'User Experience Issues',
                data: data['userExperience'],
                borderColor: 'rgba(25, 19, 132, 1)',
                backgroundColor: 'rgba(25, 19, 132, 0.2)',
            },
            {
                label: "Developer Related Issues",
                data: data['developer'],
                borderColor: 'rgba(255, 9, 132, 1)',
                backgroundColor: 'rgba(255, 9, 132, 0.2)',
            }
        ]
    }
    
    
    let config = {
        type: 'line',
        data: chartData,
        options: {
          responsive: true,
          interaction:{
            mode: 'nearest',
            intersect: false,
          },
          plugins: {
            legend: {
              position: 'left',
            },
            title: {
              display: true,
              text: 'User reported issues per version',
                font: {
                    size: 20,
                }
            }
          },
          scales:{
            x:{
                position: 'top',
                type: 'category',
                grid:{
                    drawOnChartArea: false
                },
                ticks: {
                    callback: function(value, index, values) {
                        return labels[index];
                    },
                }
            },
            xAxis2:{
                type: 'category',
                grid:{
                    drawOnChartArea: true
                },
                ticks: {
                    callback: function(value, index, values) {
                        return dates[index];
                    }
                },
            },
        }
        },
      };

    issuesChart = new Chart(issuesCtx, config);
}

function createArtifactsCharts(data){
    let labels = data['versions'];
    let dates = data['dates'];
    createRatingChart(labels, dates, data['rating']);
    createSentimentChart(labels, dates, data['sentiment']);
    createToxicityChart(labels, dates, data['toxicity']);
}

function createRatingChart(labels, dates, data){
    let ratingCtx = document.getElementById('ratingChart');
    if(ratingChart != undefined){
        ratingChart.destroy();
    }
    const ratingData = {
        labels: labels,
        datasets: [
            {
                label: 'Rating',
                data: data,
                borderColor: function(context) {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;
                    if (!chartArea) {
                        // This case happens on initial chart load
                        return;
                    }
                    return getRatingGradient(ctx, chartArea);
                },
            },
        ]
    }

    let config = {
        type: 'line',
        data: ratingData,
        options: {
            layout: {
                padding:40
            },
            normalized: true,
            responsive: true,
            interaction:{
                mode: 'nearest',
                intersect: false,
            },
            stacked: false,
            plugins: {
                legend: {
                    display:false,
                },
                title: {
                    display: true,
                    text: 'Average User Rating Across Versions',
                    font:{
                        size: 20
                    }
                }
            },
            scales:{
                x:{
                    position: 'top',
                    type: 'category',
                    grid:{
                        drawOnChartArea: false
                    },
                    ticks: {
                        callback: function(value, index, values) {
                            return labels[index];
                        },
                    }
                },
                xAxis2:{
                    type: 'category',
                    grid:{
                        drawOnChartArea: true
                    },
                    ticks: {
                        callback: function(value, index, values) {
                            return dates[index];
                        }
                    },
                },

                y:{
                    max: 5,
                    min: 1,
                    ticks:{
                        stepSize: 1
                    }
                }
            }
        }
    };

    ratingChart = new Chart(ratingCtx, config);
}

function createSentimentChart(labels, dates, data){
    let sentimentCtx = document.getElementById('sentimentChart');
    if(sentimentChart != undefined){
        sentimentChart.destroy();
    }

    const sentimentData = {
        labels: labels,
        datasets: [
            {
                label: 'Sentiment',
                data: data,
                borderColor: function(context) {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;
                    if (!chartArea) {
                        // This case happens on initial chart load
                        return;
                    }
                    return getSentimentGradient(ctx, chartArea);
                },
            },
        ]
    }

    let config = {
        type: 'line',
        data: sentimentData,
        options: {
            layout: {
                padding:40
            },
            normalized: true,
            responsive: true,
            interaction:{
                mode: 'nearest',
                intersect: false,
            },
            stacked: false,
            plugins: {
                legend: {
                    display:false,
                },
                title: {
                    display: true,
                    text: 'Average User Sentiment Across Versions',
                    font:{
                        size: 20
                    }
                }
            },
            scales:{
                x:{
                    position: 'top',
                    type: 'category',
                    grid:{
                        drawOnChartArea: false
                    },
                    ticks: {
                        callback: function(value, index, values) {
                            return labels[index];
                        },
                    }
                },
                xAxis2:{
                    type: 'category',
                    grid:{
                        drawOnChartArea: true
                    },
                    ticks: {
                        callback: function(value, index, values) {
                            return dates[index];
                        }
                    },
                },
                y:{
                    max: 1,
                    min: -1,
                    ticks:{
                        stepSize: 0.5
                    }
                }
            }
        }
    };

    sentimentChart = new Chart(sentimentCtx, config);
}

function createToxicityChart(labels, dates, data){
    let toxicityCtx = document.getElementById('toxicityChart');
    if(toxicityChart != undefined){
        toxicityChart.destroy();
    }

    const toxicityData = {
        labels: labels,
        datasets: [
            {
                label: 'Toxicity',
                data: data,
                borderColor: function(context) {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;
                    if (!chartArea) {
                        // This case happens on initial chart load
                        return;
                    }
                    return getToxicityGradient(ctx, chartArea);
                },
            },
        ]
    }

    let config = {
        type: 'line',
        data: toxicityData,
        options: {
            layout: {
                padding:40
            },
            normalized: true,
            responsive: true,
            interaction:{
                mode: 'nearest',
                intersect: false,
            },
            stacked: false,
            plugins: {
                legend: {
                    display:false,
                },
                title: {
                    display: true,
                    text: 'Average User Toxicity Across Versions',
                    font:{
                            size: 20
                    }
                }
            },
            scales:{
                x:{
                    position: 'top',
                    type: 'category',
                    grid:{
                        drawOnChartArea: false
                    },
                    ticks: {
                        callback: function(value, index, values) {
                            return labels[index];
                        },
                    }
                },
                xAxis2:{
                    type: 'category',
                    grid:{
                        drawOnChartArea: true
                    },
                    ticks: {
                        callback: function(value, index, values) {
                            return dates[index];
                        },
                    },
                },

                y:{
                    max: 1,
                    min: 0,
                    ticks:{
                        stepSize: 0.2
                    }
                }
            }
        }
    };

    toxicityChart = new Chart(toxicityCtx, config);
}

function createPackageSmellsChart(data){
    let packageCtx = document.getElementById('packageSmells');

    if(packageSmellsChart != undefined){
        packageSmellsChart.destroy();
    }

    let labels = data['versions'];
    let dates = data['dates'];

    let datasets = [{
        label: 'Package Level Smells',
        data: data['packageSmells'],
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
    }];

    const packageData = {
        labels: labels,
        datasets: datasets
    }

    let config = {
        type: 'line',
        data: packageData,
        options: {
          responsive: true,
          interaction:{
            mode: 'nearest',
            intersect: false,
          },
          plugins: {
            legend: {
                display:false,
            },
            title: {
                display: true,
                text: 'Total Package Level Smells Across Versions',
                font:{
                        size: 20
                }
            }
        },
          scales:{
            x:{
                position: 'top',
                type: 'category',
                grid:{
                    drawOnChartArea: false
                },
                ticks: {
                    callback: function(value, index, values) {
                        return labels[index];
                    },
                }
            },
            xAxis2:{
                type: 'category',
                grid:{
                    drawOnChartArea: true
                },
                ticks: {
                    callback: function(value, index, values) {
                        return dates[index];
                    }
                },
            },
        }
        },
      };

    packageSmellsChart = new Chart(packageCtx, config);    
}

function createMethodSmellsChart(data){
    let methodCtx = document.getElementById('methodSmells');

    if(methodSmellsChart != undefined){
        methodSmellsChart.destroy();
    }

    let labels = data['versions']
    let dates = data['dates'];

    let datasets = [{
        label: 'Method Level Smells',
        data: data['methodSmells'],
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
    }];

    const methodData = {
        labels: labels,
        datasets: datasets
    }

    let config = {
        type: 'line',
        data: methodData,
        options: {
          responsive: true,
          interaction:{
            mode: 'nearest',
            intersect: false,
          },
          plugins: {
            legend: {
                display:false,
            },
            title: {
                display: true,
                text: 'Total Method Level Smells Across Versions',
                font:{
                        size: 20
                }
            }
        },
          scales:{
            x:{
                position: 'top',
                type: 'category',
                grid:{
                    drawOnChartArea: false
                },
                ticks: {
                    callback: function(value, index, values) {
                        return labels[index];
                    },
                }
            },
            xAxis2:{
                type: 'category',
                grid:{
                    drawOnChartArea: true
                },
                ticks: {
                    callback: function(value, index, values) {
                        return dates[index];
                    }
                },
            },
        }
        },
      };

      methodSmellsChart = new Chart(methodCtx, config);   
}

function createClassSmellsChart(data){
    let classCtx = document.getElementById('classSmells');

    if(classSmellsChart != undefined){
        classSmellsChart.destroy();
    }

    let labels = data['versions'];
    let dates = data['dates'];
    let datasets = [{
        label: 'Class Level Smells',
        data: data['classSmells'],
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
    }];

    const classData = {
        labels: labels,
        datasets: datasets
    }

    let config = {
        type: 'line',
        data: classData,
        options: {
          responsive: true,
          interaction:{
            mode: 'nearest',
            intersect: false,
          },
          plugins: {
            legend: {
                display:false,
            },
            title: {
                display: true,
                text: 'Total Class Level Smells Across Versions',
                font:{
                        size: 20
                }
            }
        },
          scales:{
            x:{
                position: 'top',
                type: 'category',
                grid:{
                    drawOnChartArea: false
                },
                ticks: {
                    callback: function(value, index, values) {
                        return labels[index];
                    },
                }
            },
            xAxis2:{
                type: 'category',
                grid:{
                    drawOnChartArea: true
                },
                ticks: {
                    callback: function(value, index, values) {
                        return dates[index];
                    }
                },
            },
        }
        },
      };

      classSmellsChart = new Chart(classCtx, config);   
}

function clearVersion(){
    $("#versions input:checked").each(function() {
        $(this).prop('checked', false);
        $(this).closest("li").toggleClass("active", false);
    });
    selectedVersions = [];
    filterData(selectedVersions, selectedIssues);
}

function clearIssues(){
    $("#issues input:checked").each(function() {
        $(this).prop('checked', false);
        $(this).closest("li").toggleClass("active", false);
    });
    
    // selectedIssues = [];
    // filterData(selectedVersions, selectedIssues);
}


let ratingWidth, ratingHeight, ratingGradient;
function getRatingGradient(ctx, chartArea){
    const chartWidth = chartArea.right - chartArea.left;
    const chartHeight = chartArea.bottom - chartArea.top;

    if (!ratingGradient || ratingWidth !== chartWidth || ratingHeight !== chartHeight) {
        // Create the gradient because this is either the first render
        // or the size of the chart has changed
        ratingWidth = chartWidth;
        ratingHeight = chartHeight;
        ratingGradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        ratingGradient.addColorStop(0.2, '#FF0000');
        ratingGradient.addColorStop(0.4, '#FF5733');
        ratingGradient.addColorStop(0.6, '#FFA500');
        ratingGradient.addColorStop(0.8, '#00FF00');
        ratingGradient.addColorStop(1, '#006400');
      }
    
    return ratingGradient;
}

let sentimentWidth, sentimentHeight, sentimentGradient;
function getSentimentGradient(ctx, chartArea){
    const chartWidth = chartArea.right - chartArea.left;
    const chartHeight = chartArea.bottom - chartArea.top;

    if (!sentimentGradient || sentimentWidth !== chartWidth || sentimentHeight !== chartHeight) {
        // Create the gradient because this is either the first render
        // or the size of the chart has changed
        sentimentWidth = chartWidth;
        sentimentHeight = chartHeight;
        sentimentGradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        sentimentGradient.addColorStop(0.2, '#FF0000');
        sentimentGradient.addColorStop(0.4, '#FF5733');
        sentimentGradient.addColorStop(0.6, '#FFA500');
        sentimentGradient.addColorStop(0.8, '#00FF00');
        sentimentGradient.addColorStop(1, '#006400');
      }
    
    return sentimentGradient;
}

let toxicityWidth, toxicityHeight, toxicityGradient;
function getToxicityGradient(ctx, chartArea){
    const chartWidth = chartArea.right - chartArea.left;
    const chartHeight = chartArea.bottom - chartArea.top;

    if (!toxicityGradient || toxicityWidth !== chartWidth || toxicityHeight !== chartHeight) {
        // Create the gradient because this is either the first render
        // or the size of the chart has changed
        toxicityWidth = chartWidth;
        toxicityHeight = chartHeight;
        toxicityGradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        toxicityGradient.addColorStop(0.2, '#006400');
        toxicityGradient.addColorStop(0.4, '#ADFF2F');
        toxicityGradient.addColorStop(0.6, '#FFA500');
        toxicityGradient.addColorStop(0.8, '#FF5733');
        toxicityGradient.addColorStop(1, '#FF0000');
      }
    
    return toxicityGradient;
}

// adjust table columns wifth when it becomes visible
$('#tableModal').on('shown.bs.modal', function (e) {
    $('#myTable').DataTable().columns.adjust().draw();
});

function customSort(a, b){
    const partsA = a.split('.').map(part => parseInt(part, 10));
    const partsB = b.split('.').map(part => parseInt(part, 10));
  
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;
  
      if (numA !== numB) {
        return numA - numB;
      }
    }
    return 0;
}
