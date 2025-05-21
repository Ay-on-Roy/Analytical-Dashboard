document.addEventListener('DOMContentLoaded', () => {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const body = document.body;
  if (!darkModeToggle) {
    console.error("Dark mode button not found!");
    return;
  }
  const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
  body.classList.toggle('dark-mode', isDarkMode);
  body.classList.toggle('light-mode', !isDarkMode);
  darkModeToggle.textContent = isDarkMode ? '☀️' : '🌙';
  const charts = document.querySelectorAll('canvas');
  charts.forEach(chart => {
    chart.style.backgroundColor = isDarkMode ? '#2a2a2a' : '#fff';
  });
  darkModeToggle.addEventListener('click', () => {
    const isDark = body.classList.toggle('dark-mode');
    body.classList.toggle('light-mode', !isDark);
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
    darkModeToggle.textContent = isDark ? '☀️' : '🌙';
    charts.forEach(chart => {
      chart.style.backgroundColor = isDark ? '#2a2a2a' : '#fff';
    });
    if (window.barChartInstance) window.barChartInstance.update();
    if (window.pieChartInstance) window.pieChartInstance.update();
  });
});
