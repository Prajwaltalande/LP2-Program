// scripts.js
const API_BASE_URL = "http://127.0.0.1:5000//api"; 

let currentPage = 1;
let selectedMonth = 3; // Default to March

document.addEventListener('DOMContentLoaded', function () {
  const monthSelect = document.getElementById('month');
  const searchInput = document.getElementById('search');
  const prevPageButton = document.getElementById('prev-page');
  const nextPageButton = document.getElementById('next-page');

  // Initialize with default month data
  loadTransactions();
  loadStatistics();
  loadCharts();

  // Month change event listener
  monthSelect.addEventListener('change', function () {
    selectedMonth = this.value;
    currentPage = 1;
    loadTransactions();
    loadStatistics();
    loadCharts();
  });

  // Search input event listener
  searchInput.addEventListener('input', function () {
    loadTransactions();
  });

  // Pagination buttons
  prevPageButton.addEventListener('click', function () {
    if (currentPage > 1) {
      currentPage--;
      loadTransactions();
    }
  });

  nextPageButton.addEventListener('click', function () {
    currentPage++;
    loadTransactions();
  });
});

function loadTransactions() {
  const search = document.getElementById('search').value || '';
  fetch(`${API_BASE_URL}/transactions?month=${selectedMonth}&search=${search}&page=${currentPage}`)
    .then(response => response.json())
    .then(data => {
      const transactionsBody = document.getElementById('transactions-body');
      transactionsBody.innerHTML = '';

      data.forEach(transaction => {
        const row = `<tr>
                      <td>${transaction.title}</td>
                      <td>${transaction.description}</td>
                      <td>${transaction.price}</td>
                      <td>${transaction.sold ? 'Yes' : 'No'}</td>
                    </tr>`;
        transactionsBody.innerHTML += row;
      });

      // Enable/Disable pagination buttons
      document.getElementById('prev-page').disabled = currentPage === 1;
      document.getElementById('next-page').disabled = data.length < 10;
    })
    .catch(error => console.error('Error fetching transactions:', error));
}

function loadStatistics() {
  fetch(`${API_BASE_URL}/statistics?month=${selectedMonth}`)
    .then(response => response.json())
    .then(data => {
      document.getElementById('total-sale').textContent = `Total Sale: ${data.totalSaleAmount}`;
      document.getElementById('sold-items').textContent = `Sold Items: ${data.totalSoldItems}`;
      document.getElementById('not-sold-items').textContent = `Not Sold Items: ${data.totalNotSoldItems}`;
    })
    .catch(error => console.error('Error fetching statistics:', error));
}

function loadCharts() {
  // Load Bar Chart Data
  fetch(`${API_BASE_URL}/bar-chart?month=${selectedMonth}`)
    .then(response => response.json())
    .then(data => {
      const labels = data.map(range => range.range);
      const counts = data.map(range => range.count);

      const ctxBar = document.getElementById('barChartCanvas').getContext('2d');
      new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Number of Items',
            data: counts,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    });

  // Load Pie Chart Data
  fetch(`${API_BASE_URL}/pie-chart?month=${selectedMonth}`)
    .then(response => response.json())
    .then(data => {
      const labels = Object.keys(data);
      const counts = Object.values(data);

      const ctxPie = document.getElementById('pieChartCanvas').getContext('2d');
      new Chart(ctxPie, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            label: 'Category Distribution',
            data: counts,
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
            ]
          }]
        }
      });
    });
}
