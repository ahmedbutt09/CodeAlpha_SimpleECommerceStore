// Authentication JavaScript
const API_BASE_URL = "http://localhost:5000/api";

// Initialize Google Login
function initGoogleLogin() {
  const googleBtn = document.querySelector(".social-btn.google");
  if (googleBtn) {
    googleBtn.addEventListener("click", handleGoogleLogin);
  }
}

// Handle Google Login
async function handleGoogleLogin() {
  try {
    // Get Google OAuth URL from backend
    const response = await fetch(`${API_BASE_URL}/auth/google/url`);
    const data = await response.json();

    if (response.ok && data.url) {
      // Open Google OAuth in popup
      const width = 600;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        data.url,
        "Google Login",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Poll for popup closure and check for token
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          checkForToken();
        }
      }, 500);
    } else {
      showToast("Failed to get Google login URL", "error");
    }
  } catch (error) {
    console.error("Google login error:", error);
    showToast("Google login failed. Please try again.", "error");
  }
}

// Check for token after Google login
function checkForToken() {
  // Check URL for token
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  const userParam = urlParams.get("user");

  if (token && userParam) {
    try {
      const user = JSON.parse(decodeURIComponent(userParam));

      // Save token and user data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      showToast("Google login successful!");

      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);

      // Redirect to home
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1000);
    } catch (error) {
      console.error("Error parsing user data:", error);
      showToast("Login failed. Please try again.", "error");
    }
  }
}

// Check if user is on auth pages
if (
  window.location.pathname.includes("login.html") ||
  window.location.pathname.includes("register.html")
) {
  document.addEventListener("DOMContentLoaded", function () {
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    if (token) {
      window.location.href = "../index.html";
    }

    // Setup form submission
    setupAuthForms();
  });
}

function setupAuthForms() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }

  // Initialize Google login
  initGoogleLogin();

  // Check for Google callback on page load
  checkForToken();
}

async function handleLogin(event) {
  event.preventDefault();

  const form = event.target;
  const email = form.querySelector("#email").value;
  const password = form.querySelector("#password").value;
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorDiv = form.querySelector(".error-message");

  // Show loading state
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Logging in...";
  submitBtn.disabled = true;

  if (errorDiv) errorDiv.textContent = "";

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Save token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showToast("Login successful!");

      // Redirect to home page
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1000);
    } else {
      throw new Error(data.error || "Login failed");
    }
  } catch (error) {
    if (errorDiv) {
      errorDiv.textContent = error.message;
    } else {
      showToast(error.message, "error");
    }
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

async function handleRegister(event) {
  event.preventDefault();

  const form = event.target;
  const username = form.querySelector("#username").value;
  const email = form.querySelector("#email").value;
  const password = form.querySelector("#password").value;
  const confirmPassword = form.querySelector("#confirmPassword").value;
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorDiv = form.querySelector(".error-message");

  // Validate passwords match
  if (password !== confirmPassword) {
    if (errorDiv) {
      errorDiv.textContent = "Passwords do not match!";
    }
    return;
  }

  // Show loading state
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Creating account...";
  submitBtn.disabled = true;

  if (errorDiv) errorDiv.textContent = "";

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Save token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showToast("Account created successfully!");

      // Redirect to home page
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1000);
    } else {
      throw new Error(
        data.error || data.errors?.[0]?.msg || "Registration failed"
      );
    }
  } catch (error) {
    if (errorDiv) {
      errorDiv.textContent = error.message;
    } else {
      showToast(error.message, "error");
    }
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
