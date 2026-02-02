const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", function () {
  // Check if already logged in as admin
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (token && user.role === "admin") {
    window.location.href = "admin.html";
  }

  // Setup form
  const loginForm = document.getElementById("adminLoginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleAdminLogin);
  }
});

async function handleAdminLogin(event) {
  event.preventDefault();

  const form = event.target;
  const email = form.querySelector("#email").value;
  const password = form.querySelector("#password").value;
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorDiv = form.querySelector(".error-message");

  // Show loading state
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Verifying...";
  submitBtn.disabled = true;

  if (errorDiv) errorDiv.textContent = "";

  try {
    // Use the admin-login endpoint
    const response = await fetch(`${API_BASE_URL}/auth/admin-login`, {
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

      showToast("Admin login successful!");

      // Redirect to admin panel
      setTimeout(() => {
        window.location.href = "admin.html";
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

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
