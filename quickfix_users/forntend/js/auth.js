import { signupUser, loginUser } from './api.js';
import { showToast } from './toast.js'; // Import the new toast function

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  // --- Signup Form Handler ---
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      if (!name || !email || !password) {
        showToast('Please fill in all details.', true);
        return;
      }

      const result = await signupUser(name, email, password);

      if (result.user) {
        showToast('Signup successful! Please log in.');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500); // Wait 1.5 seconds before redirecting
      } else {
        showToast(result.error || 'Signup failed.', true);
      }
    });
  }

  // --- Login Form Handler ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      if (!email || !password) {
        showToast('Please enter your email and password.', true);
        return;
      }

      const result = await loginUser(email, password);

      if (result.token) {
        showToast('Login successful! Redirecting...');
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('userName', result.user.name);
        localStorage.setItem('userEmail', result.user.email);
        localStorage.setItem('userId', result.user._id);

        setTimeout(() => {
          window.location.href = '../dashboard/dashboard.html';
        }, 1500); // Wait 1.5 seconds before redirecting
      } else {
        showToast(result.error || 'Login failed.', true);
      }
    });
  }
});