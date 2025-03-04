
const inputData = [
  ["2025-03-03T03:23:54.350Z", "1", "Successful", "Random Message 1"],
  ["2025-03-03T03:23:54.350Z", "2", "Successful", "Random Message 2"],
  ["2025-03-03T03:23:54.350Z", "3", "Successful", "Random Message 3"],
  ["2025-03-03T03:23:54.350Z", "4", "Failed", "Random Message 4"],
  ["2025-03-03T04:49:54.350Z", "5", "Failed", "Random Message 5"],
  ["2025-03-03T03:23:54.350Z", "6", "Successful", "Random Message 6"],
  ["2025-03-02T03:23:54.350Z", "7", "Failed", "Random Message 7"],
  ["2025-03-02T03:23:54.350Z", "8", "Pending", "Random Message 8"],
  ["2025-03-02T03:23:54.350Z", "9", "Failed", "Random Message 9"],
  ["2025-03-02T03:23:54.350Z", "10", "Successful", "Random Message 10"],
  ["2025-03-02T03:23:54.350Z", "11", "Failed", "Random Message 11"],
  ["2025-03-02T03:23:54.350Z", "12", "Failed", "Random Message 12"],
  ["2025-03-01T03:23:54.350Z", "13", "Pending", "Random Message 13"],
  ["2025-03-01T03:23:54.350Z", "14", "Failed", "Random Message 14"],
  ["2025-03-01T03:23:54.350Z", "15", "Failed", "Random Message 15"],
  ["2025-03-01T03:23:54.350Z", "16", "Failed", "Random Message 16"],
  ["2025-03-01T03:23:54.350Z", "16", "Successful", "Random Message 16"],
  ["2025-03-01T03:23:54.350Z", "17", "Successful", "Random Message 17"],
  ["2025-03-01T03:23:54.350Z", "18", "Successful", "Random Message 18"],
  ["2025-02-28T03:23:54.350Z", "19", "Failed", "Random Message 19"],
  ["2025-02-28T03:23:54.350Z", "20", "Failed", "Random Message 20"],
  ["2025-02-28T03:23:54.350Z", "20", "Pending", "Random Message 20"],
  ["2025-02-28T03:23:54.350Z", "4", "Failed", "Random Message 21"],
  ["2025-02-28T03:23:54.350Z", "5", "Successful", "Random Message 22"],
  ["2025-02-28T03:23:54.350Z", "6", "Successful", "Random Message 23"],
  ["2025-02-28T03:23:54.350Z", "7", "Failed", "Random Message 24"],
  ["2025-02-27T03:23:54.350Z", "1", "Failed", "Random Message 25"],
  ["2025-02-27T03:23:54.350Z", "2", "Successful", "Random Message 26"],
  ["2025-02-27T03:23:54.350Z", "20", "Failed", "Random Message 27"],
  ["2025-02-27T03:23:54.350Z", "15", "Successful", "Random Message 28"],
  ["2025-02-27T03:23:54.350Z", "16", "Failed", "Random Message 29"]
];

const uniqueValues = [...new Set(inputData.map(item => item[1]))];

const filterUnit = document.getElementById('filterUnit');
uniqueValues.forEach(value => {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = value;
  filterUnit.appendChild(option);
});

function processInputData(data, startDate, endDate, unit, filterUnit, filterStatus) {
  const datasets = {
    "Successful": {},
    "Failed": {},
    "Pending": {}
  };

  data.forEach(item => {
    const [date, stack, status, title] = item;
    const itemDate = new Date(date); // Keep in GMT
    if (
      itemDate >= startDate &&
      itemDate <= endDate &&
      (!filterUnit || stack === filterUnit) &&
      (!filterStatus || status === filterStatus)
    ) {
      const datasetKey = `${status} - ${stack}`;
      if (!datasets[status][datasetKey]) {
        datasets[status][datasetKey] = {
          label: datasetKey,
          data: [],
          backgroundColor: status === 'Successful' ? '#57F287' : status === "Failed" ? '#ED4245' : "#FEE75C",
          stack: stack,
          titles: []
        };
      }

      const timeLabel = unit === 'hour' ? formatAmPm(itemDate) : itemDate.toISOString().split('T')[0];
      const existingEntry = datasets[status][datasetKey].data.find(entry => entry.x === timeLabel);
      if (existingEntry) {
        existingEntry.y += 1;
        existingEntry.titles.push(title);
      } else {
        datasets[status][datasetKey].data.push({ x: timeLabel, y: 1, titles: [title] });
      }
    }
  });

  return [...Object.values(datasets["Successful"]), ...Object.values(datasets["Failed"]), ...Object.values(datasets["Pending"])];
}

function generateLabels(unit, startDate, endDate) {
  const labels = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (unit === 'day') {
      labels.push(currentDate.toISOString().split('T')[0]);
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    } else if (unit === 'hour') {
      labels.push(formatAmPm(currentDate));
      currentDate.setUTCHours(currentDate.getUTCHours() + 1);
    }
  }

  return labels;
}

function formatAmPm(date) {
  let hours = date.getUTCHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const datePart = date.toISOString().split('T')[0]; // Add the date part
  return `${datePart} ${hours} ${ampm}`;
}

window.onload = function () {
  const ctx = document.getElementById('stackedBarChart').getContext('2d');

  function getMaxTicksLimit() {
    if (window.innerWidth <= 425) {
      return 2;
    } else {
      return 5;
    }
  }

  const stackedBarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      datasets: []
    },
    options: {
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: function (tooltipItems) {
              return `${tooltipItems[0].label}\nUnit: ${tooltipItems[0].dataset.label.split(" - ")[1]}`;
            },
            label: function (context) {
              const label = context.dataset.label || '';
              const sum = context.raw.y;
              return `${label.split(" - ")[0]}: ${sum}`;
            },
            afterBody: function (context) {
              const titles = context[0].raw.titles;
              return `Message${titles.length > 1 ? "s" : ""}:` + titles.map(title => `\n${title}`);
            },
          }
        }
      },
      scales: {
        x: {
          type: 'category',
          stacked: true,
          ticks: {
            autoSkip: true,
            maxTicksLimit: getMaxTicksLimit()
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            callback: function (value) {
              return Number.isInteger(value) ? value : '';
            }
          }
        }
      },
      maintainAspectRatio: false,
      responsive: true,
      elements: {
        bar: {
          categoryPercentage: 0.8, // Adjust category width percentage to ensure even sizing
          barPercentage: 1.0 // Adjust bar width percentage to ensure bars are evenly sized within their group
        }
      }
    }
  });

  function setActiveButton(button) {
    var buttons = document.querySelectorAll('.chart-button');
    buttons.forEach(function (btn) {
      btn.classList.remove('active');
    });
    button.classList.add('active');
  }

  function updateChartHandler(event) {
    var button = event.target;
    setActiveButton(button);
    var days = button.getAttribute('data-days');
    var interval = button.getAttribute('data-interval');
    updateChart(stackedBarChart, parseInt(days), interval);
  }

  document.querySelectorAll('.chart-button').forEach(function (button) {
    button.addEventListener('click', updateChartHandler);
  });

  document.getElementById('filterUnit').onchange = function () {
    updateChart(stackedBarChart, 30, 'day');
  };
  document.getElementById('filterStatus').onchange = function () {
    updateChart(stackedBarChart, 30, 'day');
  };

  function updateChart(chart, days, unit) {
    const currentDate = new Date();
    let startDate = new Date(currentDate);

    if (unit === 'hour') {
      startDate.setUTCHours(startDate.getUTCHours() - 24);
    } else {
      startDate.setUTCDate(startDate.getUTCDate() - days);
    }

    const filterUnit = document.getElementById('filterUnit').value;
    const filterStatus = document.getElementById('filterStatus').value;

    const datasets = processInputData(inputData, startDate, currentDate, unit, filterUnit, filterStatus);
    const labels = generateLabels(unit, startDate, currentDate);

    chart.options.scales.x.labels = labels;
    chart.data.datasets = datasets;
    chart.update();
  }

  // Adjust the labels and data for the day filter to cover the past 24 hours
  document.getElementById('btnDay').onclick = function () {
    const currentDate = new Date();
    const startDate = new Date(currentDate);
    startDate.setUTCHours(startDate.getUTCHours() - 24);

    const filterUnit = document.getElementById('filterUnit').value;
    const filterStatus = document.getElementById('filterStatus').value;

    const datasets = processInputData(inputData, startDate, currentDate, 'hour', filterUnit, filterStatus);
    const labels = generateLabels('hour', startDate, currentDate);

    stackedBarChart.options.scales.x.labels = labels;
    stackedBarChart.data.datasets = datasets;
    stackedBarChart.update();
  };

  updateChart(stackedBarChart, 30, 'day'); // Default view
};
