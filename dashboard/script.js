var reviews;
var issuesPerVersion;
var artifacts_per_version;

let issuesChart;
let ratingChart;
let sentimentChart;
let toxicityChart;
let packageSmellsChart;
let methodSmellsChart;
let classSmellsChart;
let issuesDistChart;
let selectedVersions = [];
let selectedIssues = [];
let allVersions = [];
let allIssues = [];
let smells = [];
let filteredSmells = [];

let releases = [];

$(document).ready(function() {
    // load the reviews for Antenna Pod
    $.getJSON('data.json', function(data) {
        smells = data;
        filteredSmells = smells;
    });

    $.getJSON('Applications_Reviews.json', function(data) {
        reviews = data.filter((item) => item.app_name == 'Antenna Pod');

        allVersions = reviews.map((item) => item.reviewCreatedVersion);
        allVersions = [...new Set(allVersions)];
        allVersions = allVersions.sort();
        allVersions = allVersions.reverse();
    
        allVersions.forEach(version => {
            // append a new li for each version
            let text = `<li><label><input type="checkbox" value="${version}">Version ${version}</label></li>`
            $('#versions').append(text);
        });

        reviews.forEach(review => {
            if(review.label && review.label.length > 0){
                review.label.forEach(issue => {
                    allIssues.push(issue[2]);
                });
            }
        });

        allIssues = [...new Set(allIssues)];

        allIssues.forEach(issue => {
            let text = `<li><label><input type="checkbox" value="${issue}">${issue}</label></li>`
            $('#issues').append(text);
        });

        render(reviews);
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

function updateData(data){
    
    issuesPerVersion = {};
    
    data.forEach(review => {
        if(review.label && review.label.length > 0){
            review.label.forEach(issue => {
              let issue_name = issue[2];
              if(issuesPerVersion[review.reviewCreatedVersion]){
                  if(issuesPerVersion[review.reviewCreatedVersion][issue_name]){
                      issuesPerVersion[review.reviewCreatedVersion][issue_name]++;
                  } else {
                      issuesPerVersion[review.reviewCreatedVersion][issue_name] = 1;
                  }
              } else {
                  issuesPerVersion[review.reviewCreatedVersion] = {};
                  issuesPerVersion[review.reviewCreatedVersion][issue_name] = 1;
              }
            });
        }
    });

    
    // sort the issues per version from smaller to larger version
    issuesPerVersion = Object.keys(issuesPerVersion).sort().reduce(
        (obj, key) => { 
          obj[key] = issuesPerVersion[key];
          return obj;
        },
        {}
      );
    
    // for the given reviews, calculate the average score, sentiment and toxicity per version
    artifacts_per_version = {};

    data.forEach(review => {
        if(artifacts_per_version[review.reviewCreatedVersion]){
            artifacts_per_version[review.reviewCreatedVersion].avgScore += review.score;
            artifacts_per_version[review.reviewCreatedVersion].avgSentiment += review.sentiment;
            artifacts_per_version[review.reviewCreatedVersion].avgToxicity += review.toxicity;
            artifacts_per_version[review.reviewCreatedVersion].count++;
        } else {
            artifacts_per_version[review.reviewCreatedVersion] = {
                avgScore: review.score,
                avgSentiment: review.sentiment,
                avgToxicity: review.toxicity,
                count: 1
            };
        }
    });

    artifacts_per_version = Object.keys(artifacts_per_version).sort().reduce(
        (obj, key) => { 
          obj[key] = artifacts_per_version[key];
          return obj;
        },
        {}
      );
}

function render(data){
    updateData(data);
    // fill the table with the reviews
    $('#myTable').DataTable().clear().rows.add(data).draw();
    $('#sentiment').text((data.reduce((acc, item) => acc + item.sentiment, 0) / data.length).toFixed(2));
    $('#toxicity').text((data.reduce((acc, item) => acc + item.toxicity, 0) / data.length).toFixed(2));
    $('#rating').text((data.reduce((acc, item) => acc + item.score, 0) / data.length).toFixed(2));
    $('#issuesCount').text(data.reduce((acc, item) => {
        if(item.label && item.label.length > 0){
            return acc + item.label.length;
        }
        return acc;
    }
    , 0));


    // create the chart
    createChart();
    createArtifactsCharts();
    createPackageSmellsChart();
    createMethodSmellsChart();
    createClassSmellsChart();
    createIssuesDistributionChart();
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
    if(versions.length == 0){
        versions = allVersions;
    }

    let filterData = reviews.filter((item) => versions.includes(item.reviewCreatedVersion));
    filteredSmells = smells.filter((item) => versions.includes(item.version));

    if(issues.length == 0){
        render(filterData);
        return;
    }
    
    filterData = filterData.filter((item) => {
        if(item.label && item.label.length > 0){
            let labels = item.label.map((label) => label[2]);
            return labels.some(label => issues.includes(label));
        } else {
            return false;
        }
    });

    render(filterData);
}

function createIssuesDistributionChart(){
    const issuesDistributionCtx = document.getElementById('issuesDistChart');
    
    if(issuesDistChart != undefined){
        issuesDistChart.destroy();
    }

    let labels = ['Crashing Issues', 'Performance Issues', 'UI / Design Issues', 'Functionality Issues', 'Security Related Issues', 'User Experience Issues', 'Developer Related Issues'];
    let data = labels.map((label) => {
        return issuesPerVersion ? Object.keys(issuesPerVersion).reduce((acc, key) => {
            return acc + (issuesPerVersion[key][label] || 0);
        }, 0) : 0;
    });


    let datasets = [{
        label: 'Types of issues',
        data: data,
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

    issuesDistChart = new Chart(issuesDistributionCtx, config);
}

function createChart() {
    let issuesCtx = document.getElementById('issuesChart');

    if(issuesChart != undefined){
        issuesChart.destroy();
    }

    let labels = Object.keys(issuesPerVersion);
    labels = labels.sort(customSort);
    // match labels to dates
    let dates = labels.map((label) => {
        let release = smells.find((item) => item.version == label);
        // format the date as a string DD/MM/YYYY
        return release ? release.date.split('T')[0] : '';
    });

    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Crashing Issues',
                data: Object.keys(issuesPerVersion).map((key) => {
                    return issuesPerVersion[key]['Crashing Issues'] || 0;
                }),
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
            },
            {
                label: 'Performance Issues',
                data: Object.keys(issuesPerVersion).map((key) => {
                    return issuesPerVersion[key]['Performance Issues'] || 0;
                }),
                borderColor: 'rgba(255, 206, 86, 1)',
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
            },
            {
                label: 'UI / Design Issues',
                data: Object.keys(issuesPerVersion).map((key) => {
                    return issuesPerVersion[key]['UI / Design Issues'] || 0;
                }),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
            },
            {
                label: 'Functionality Issues',
                data: Object.keys(issuesPerVersion).map((key) => {
                    return issuesPerVersion[key]['Functionality Issues'] || 0;
                }),
                borderColor: 'rgba(153, 102, 255, 1)',
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
            },
            {
                label: 'Security Related Issues',
                data:Object.keys(issuesPerVersion).map((key) => {
                    return issuesPerVersion[key]['Security Related Issues'] || 0;
                }),
                borderColor: 'rgba(255, 159, 64, 1)',
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
            },
            {
                label: 'User Experience Issues',
                data:Object.keys(issuesPerVersion).map((key) => {
                    return issuesPerVersion[key]['User Experience Issues'] || 0;
                }),
                borderColor: 'rgba(25, 19, 132, 1)',
                backgroundColor: 'rgba(25, 19, 132, 0.2)',
            },
            {
                label: "Developer Related Issues",
                data: Object.keys(issuesPerVersion).map((key) => {
                    return issuesPerVersion[key]['Developer Related Issues'] || 0;
                }),
                borderColor: 'rgba(255, 9, 132, 1)',
                backgroundColor: 'rgba(255, 9, 132, 0.2)',
            }
        ]
    }
    
    
    let config = {
        type: 'line',
        data: data,
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

function createArtifactsCharts(){
    let labels = Object.keys(artifacts_per_version);
    labels = labels.sort(customSort);
    // match labels to dates
    let dates = labels.map((label) => {
        let release = smells.find((item) => item.version == label);
        console.log(release);
        // format the date as a string DD/MM/YYYY
        return release ? release.date.split('T')[0] : '';
    });

    createRatingChart(labels, dates);
    createSentimentChart(labels, dates);
    createToxicityChart(labels, dates);
}

function createRatingChart(labels, dates){
    let ratingCtx = document.getElementById('ratingChart');
    if(ratingChart != undefined){
        ratingChart.destroy();
    }

    const ratingData = {
        labels: labels,
        datasets: [
            {
                label: 'Rating',
                data: Object.keys(artifacts_per_version).map((key) => {
                    return artifacts_per_version[key]['avgScore'] / artifacts_per_version[key]['count'] || 0;
                }),
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

function createSentimentChart(labels, dates){
    let sentimentCtx = document.getElementById('sentimentChart');
    if(sentimentChart != undefined){
        sentimentChart.destroy();
    }

    const sentimentData = {
        labels: labels,
        datasets: [
            {
                label: 'Sentiment',
                data: Object.keys(artifacts_per_version).map((key) => {
                    return artifacts_per_version[key]['avgSentiment'] / artifacts_per_version[key]['count'] || 0;
                }),
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

function createToxicityChart(labels, dates){
    let toxicityCtx = document.getElementById('toxicityChart');
    if(toxicityChart != undefined){
        toxicityChart.destroy();
    }

    const toxicityData = {
        labels: labels,
        datasets: [
            {
                label: 'Toxicity',
                data: Object.keys(artifacts_per_version).map((key) => {
                    return artifacts_per_version[key]['avgToxicity'] / artifacts_per_version[key]['count'] || 0;
                }),
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

function createPackageSmellsChart(){
    let packageCtx = document.getElementById('packageSmells');

    if(packageSmellsChart != undefined){
        packageSmellsChart.destroy();
    }

    let labels = filteredSmells.map((item) => item.version);
    let dates = filteredSmells.map((item) => item.date);

    let datasets = [{
        label: 'Package Level Smells',
        data: filteredSmells.map((item) => item.packageSmells),
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
                        return dates[index].split('T')[0];
                    }
                },
            },
        }
        },
      };

    packageSmellsChart = new Chart(packageCtx, config);    
}

function createMethodSmellsChart(){
    let methodCtx = document.getElementById('methodSmells');

    if(methodSmellsChart != undefined){
        methodSmellsChart.destroy();
    }

    let labels = filteredSmells.map((item) => item.version);
    let dates = filteredSmells.map((item) => item.date);

    let datasets = [{
        label: 'Method Level Smells',
        data: filteredSmells.map((item) => item.methodSmells),
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
                        return dates[index].split('T')[0];
                    }
                },
            },
        }
        },
      };

      methodSmellsChart = new Chart(methodCtx, config);   
}

function createClassSmellsChart(){
    let classCtx = document.getElementById('classSmells');

    if(classSmellsChart != undefined){
        classSmellsChart.destroy();
    }

    let labels = filteredSmells.map((item) => item.version);
    let dates = filteredSmells.map((item) => item.date);

    let datasets = [{
        label: 'Class Level Smells',
        data: filteredSmells.map((item) => item.classSmells),
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
                        return dates[index].split('T')[0];
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
    
    selectedIssues = [];
    filterData(selectedVersions, selectedIssues);
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
