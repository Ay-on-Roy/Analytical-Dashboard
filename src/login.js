import { validCredentials } from '../credentials.js';

document.getElementById('loginForm').addEventListener('submit', (event) => {
  event.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMsg = document.getElementById('errorMsg');

  const user = validCredentials.find(u => u.username === username && u.password === password);

  if (user) {
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('role', user.role);
    console.log("Login successful, redirecting...");
    window.location.href = './index.html';
  } else {
    errorMsg.innerText = 'Invalid username or password.';
    errorMsg.style.color = 'red';
  }
});
