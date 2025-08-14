// User Authentication Management
const API_URL = 'http://localhost:8001/api';

// Authentication functions
async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Network error. Please try again.' };
  }
}

async function signupUser(name, email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Signup error:', error);
    return { error: 'Network error. Please try again.' };
  }
}

// Event handlers
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
      const confirmPassword = document.getElementById('confirm-password').value;

      if (!name || !email || !password || !confirmPassword) {
        showToast('Please fill in all details.', true);
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match.', true);
        return;
      }

      const result = await signupUser(name, email, password);

      if (result.message === "User created successfully") {
        showToast('Signup successful! Please log in.');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
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

      if (result.message === "Login successful") {
        showToast('Login successful! Redirecting...');
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('userName', result.user.name);
        localStorage.setItem('userEmail', result.user.email);
        localStorage.setItem('userId', result.user._id);

        setTimeout(() => {
          window.location.href = '../dashboard/dashboard.html';
        }, 1500);
      } else {
        showToast(result.error || 'Login failed.', true);
      }
    });
  }
});