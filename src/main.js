let rawData = [];

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('loggedIn') !== 'true') {
    window.location.href = './login.html';
  }
});

function logout() {
  localStorage.clear(); 
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const roleSpan = document.getElementById('userRole');
  const role = localStorage.getItem('role');
  if (roleSpan && role) {
    roleSpan.textContent = `Logged in as: ${role}`;
  }
});

function deleteRow(id) {
  rawData = rawData.filter(d => d.ID !== id);
  renderDashboard(rawData);
}

function populateFilters(data) {
  const divisions = [...new Set(data.map(d => d.Division))];
  const genders = [...new Set(data.map(d => d.Gender))];

  const divFilter = document.getElementById('divisionFilter');
  const genderFilter = document.getElementById('genderFilter');

  divFilter.innerHTML = `<option value="">All Divisions</option>`;
  genderFilter.innerHTML = `<option value="">All Genders</option>`;

  divisions.forEach(div => {
    const opt = document.createElement('option');
    opt.value = div;
    opt.textContent = div;
    divFilter.appendChild(opt);
  });

  genders.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g;
    opt.textContent = g;
    genderFilter.appendChild(opt);
  });

  divFilter.onchange = applyFilters;
  genderFilter.onchange = applyFilters;
}

function applyFilters() {
  const divisionSelect = document.getElementById('divisionFilter');
  const selectedDivisions = [...divisionSelect.selectedOptions].map(opt => opt.value);
  const gender = document.getElementById('genderFilter').value;

  const filtered = rawData.filter(d => {
    const divisionMatches = selectedDivisions.includes("") || selectedDivisions.length === 0 || selectedDivisions.includes(d.Division);
    const genderMatches = !gender || d.Gender === gender;
    return divisionMatches && genderMatches;
  });

  renderDashboard(filtered);
}

function renderDashboard(data) {
  document.getElementById('totalCustomers').textContent = `Total Customers: ${data.length}`;

  const validIncome = data.map(d => d.Income).filter(i => i > 0);
  const avgIncome = (validIncome.reduce((a, b) => a + b, 0) / validIncome.length).toFixed(0);
  document.getElementById('avgIncome').textContent = `Average Income: ৳${avgIncome}`;

  const avgAge = (data.reduce((sum, d) => sum + d.Age, 0) / data.length).toFixed(1);
  document.getElementById('avgAge').textContent = `Average Age: ${avgAge}`;

  const divMap = {};

  data.forEach(d => {
    if (d.Income > 0) {
      if (!divMap[d.Division]) divMap[d.Division] = [];
      divMap[d.Division].push(d.Income);
    }
  });

  const divisions = Object.keys(divMap);
  const avgIncomes = divisions.map(div =>
    Math.round(divMap[div].reduce((a, b) => a + b, 0) / divMap[div].length)
  );

  if (window.barChartInstance) {
    window.barChartInstance.destroy();
  }

  const ctx = document.getElementById('barChart').getContext('2d');
  window.barChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: divisions,
      datasets: [{
        label: 'Avg Income',
        data: avgIncomes,
        backgroundColor: '#4CAF50'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `৳ ${ctx.raw}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: val => `৳${val}` }
        }
      }
    }
  });

  const genderMap = {};

  data.forEach(d => {
    if (!genderMap[d.Gender]) genderMap[d.Gender] = 0;
    genderMap[d.Gender]++;
  });

  const genderLabels = Object.keys(genderMap);
  const genderCounts = Object.values(genderMap);

  if (window.pieChartInstance) {
    window.pieChartInstance.destroy();
  }

  const pieCtx = document.getElementById('pieChart').getContext('2d');
  window.pieChartInstance = new Chart(pieCtx, {
    type: 'pie',
    data: {
      labels: genderLabels,
      datasets: [{
        label: 'Gender Distribution',
        data: genderCounts,
        backgroundColor: ['#4285F4', '#FBBC05', '#34A853']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });

  const tbody = document.querySelector('#dataTable tbody');
  tbody.innerHTML = '';

  const currentRole = localStorage.getItem('role') || 'Guest';

  data.forEach(d => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${d.ID}</td>
      <td>${d.CustomerName}</td>
      <td>${d.Division}</td>
      <td>${d.Gender}</td>
      <td>${d.MaritalStatus}</td>
      <td>${d.Age}</td>
      <td>${d.Income}</td>
      <td>
        ${currentRole === 'Admin' ? `<button onclick="deleteRow('${d.ID}')">Delete</button>` : ''}
      </td>
    `;
    tbody.appendChild(row);
  });

  if (currentRole === 'Admin') {
    document.getElementById('adminControls').innerHTML = `
      <button onclick="exportCSV()">Export CSV</button>
    `;
  } else {
    document.getElementById('adminControls').innerHTML = '';
  }
}

fetch('/data.csv')
  .then(res => res.text())
  .then(csv => {
    const rows = csv.trim().split('\n');
    const headers = rows[0].split(',');

    rawData = rows.slice(1).map(row => {
      const values = row.split(',');
      const obj = {};
      headers.forEach((h, i) => {
        const key = h.trim().replace(/ /g, '');
        obj[key] = values[i].trim();
      });
      obj.Age = parseInt(obj.Age);
      obj.Income = parseInt(obj.Income);
      return obj;
    });

    populateFilters(rawData);
    renderDashboard(rawData);
    const role = localStorage.getItem('role') || 'Guest';
    document.getElementById('userRole').textContent = `Role: ${role}`;
  })
  .catch(err => {
    console.error("CSV load error:", err);
    alert("Failed to load data");
  });

function exportCSV() {
  const table = document.getElementById('dataTable');
  const rows = table.querySelectorAll('tr');
  if (rows.length === 0) {
    alert("No data available to export.");
    return;
  }
  let csvContent = "";
  const headers = [...rows[0].querySelectorAll('th')].map(th => th.textContent.trim());
  csvContent += headers.join(",") + "\n";
  [...rows].slice(1).forEach(row => {
    const rowData = [...row.querySelectorAll('td')].map(td => td.textContent.trim());
    csvContent += rowData.join(",") + "\n";
  });
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `admin_district_gender.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
  const charts = document.querySelectorAll('canvas');

  charts.forEach(chart => {
    chart.style.backgroundColor = isDarkMode ? '#2a2a2a' : '#fff';
  });
});

window.logout = logout;
