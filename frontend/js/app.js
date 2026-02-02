// Main Application JavaScript
const API_BASE_URL = "http://localhost:5000/api";
let currentUser = null;
let currentPage = 1;
let currentCategory = "all";
let currentSearch = "";

document.addEventListener("DOMContentLoaded", function () {
  // Initialize everything
  initializeApp();
});

function initializeApp() {
  // Initialize navigation
  initializeNavigation();

  // Initialize cart count
  updateCartCount();

  // Load initial products (only on homepage)
  if (document.getElementById("productsGrid")) {
    loadProducts();
  }

  // Check authentication status
  checkAuthStatus();
}

function initializeNavigation() {
  // Update cart count
  updateCartCount();

  // Set up active page highlighting
  highlightCurrentPage();

  // Setup mobile menu
  setupMobileNavigation();

  // Setup event listeners
  setupEventListeners();
}

function setupEventListeners() {
  // Search functionality - only if elements exist
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");

  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", performSearch);
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") performSearch();
    });
  }

  // Category filters - only if elements exist
  const categoryButtons = document.querySelectorAll(".category-btn");
  if (categoryButtons.length > 0) {
    categoryButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        // Remove active class from all buttons
        categoryButtons.forEach((b) => b.classList.remove("active"));
        // Add active class to clicked button
        btn.classList.add("active");

        currentCategory = btn.dataset.category;
        currentPage = 1;
        loadProducts();
      });
    });
  }
}

function setupMobileNavigation() {
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      navLinks.classList.toggle("show-mobile");
      // Toggle icon
      const icon = this.querySelector("i");
      if (icon.classList.contains("fa-bars")) {
        icon.classList.remove("fa-bars");
        icon.classList.add("fa-times");
      } else {
        icon.classList.remove("fa-times");
        icon.classList.add("fa-bars");
      }
    });

    // Close mobile menu when clicking on a link
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("show-mobile");
        const icon = mobileMenuBtn.querySelector("i");
        if (icon) {
          icon.classList.remove("fa-times");
          icon.classList.add("fa-bars");
        }
      });
    });

    // Close mobile menu when clicking outside
    document.addEventListener("click", (event) => {
      if (
        !event.target.closest(".navbar") &&
        navLinks.classList.contains("show-mobile")
      ) {
        navLinks.classList.remove("show-mobile");
        const icon = mobileMenuBtn.querySelector("i");
        if (icon) {
          icon.classList.remove("fa-times");
          icon.classList.add("fa-bars");
        }
      }
    });
  }
}

function highlightCurrentPage() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".nav-links a");

  navLinks.forEach((link) => {
    link.classList.remove("active");
    const linkHref = link.getAttribute("href");

    // Remove any leading/trailing slashes for comparison
    const normalizedPath = currentPath.replace(/\/$/, "");
    const normalizedHref = linkHref ? linkHref.replace(/^\.\//, "") : "";

    // Check if this link is the current page
    if (
      normalizedPath.endsWith(normalizedHref) ||
      (normalizedPath === "" && linkHref === "index.html")
    ) {
      link.classList.add("active");
    }
  });
}

async function performSearch() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  currentSearch = searchInput.value.trim();
  currentPage = 1;

  await loadProducts();
}

async function loadProducts() {
  try {
    const productsGrid = document.getElementById("productsGrid");
    if (!productsGrid) return;

    // Show loading state
    productsGrid.innerHTML = '<div class="loading">Loading products...</div>';

    // Build query string
    let query = `?page=${currentPage}&limit=8`;
    if (currentSearch) query += `&search=${encodeURIComponent(currentSearch)}`;
    if (currentCategory !== "all") query += `&category=${currentCategory}`;

    const response = await fetch(`${API_BASE_URL}/products${query}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    displayProducts(data.products);
    setupPagination(data.totalPages, data.currentPage);
  } catch (error) {
    console.error("Error loading products:", error);
    const productsGrid = document.getElementById("productsGrid");
    if (productsGrid) {
      productsGrid.innerHTML = `
        <div class="error">
          <p>Failed to load products. Please try again later.</p>
          <button onclick="loadProducts()" class="btn-view">Retry</button>
        </div>
      `;
    }
  }
}

function displayProducts(products) {
  const productsGrid = document.getElementById("productsGrid");
  if (!productsGrid) return;

  if (!products || products.length === 0) {
    productsGrid.innerHTML = '<div class="loading">No products found.</div>';
    return;
  }

  productsGrid.innerHTML = products
    .map(
      (product) => `
        <div class="product-card" data-id="${product._id}">
            <div class="product-img">
                <img src="${
                  product.image ||
                  "https://via.placeholder.com/300x200?text=Product+Image"
                }" 
                     alt="${product.name}"
                     onerror="this.src='https://via.placeholder.com/300x200?text=Product+Image'">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-category">${product.category}</div>
                <div class="product-description">${product.description}</div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-stock">${
                  product.stock > 0 ? "In Stock" : "Out of Stock"
                }</div>
                <div class="product-actions">
                    <button class="btn-view" onclick="viewProductDetails('${
                      product._id
                    }')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn-add-cart" onclick="addToCart('${
                      product._id
                    }', '${product.name}', ${product.price}, '${
        product.image || ""
      }')" ${product.stock === 0 ? "disabled" : ""}>
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

function setupPagination(totalPages, currentPageNum) {
  const paginationDiv = document.getElementById("pagination");
  if (!paginationDiv) return;

  if (totalPages <= 1) {
    paginationDiv.innerHTML = "";
    return;
  }

  let paginationHTML = "";

  // Previous button
  if (currentPageNum > 1) {
    paginationHTML += `<button onclick="changePage(${
      currentPageNum - 1
    })">&laquo; Previous</button>`;
  }

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPageNum) {
      paginationHTML += `<button class="active">${i}</button>`;
    } else if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPageNum - 1 && i <= currentPageNum + 1)
    ) {
      paginationHTML += `<button onclick="changePage(${i})">${i}</button>`;
    } else if (i === currentPageNum - 2 || i === currentPageNum + 2) {
      paginationHTML += `<span class="dots">...</span>`;
    }
  }

  // Next button
  if (currentPageNum < totalPages) {
    paginationHTML += `<button onclick="changePage(${
      currentPageNum + 1
    })">Next &raquo;</button>`;
  }

  paginationDiv.innerHTML = paginationHTML;
}

function changePage(page) {
  currentPage = page;
  loadProducts();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function viewProductDetails(productId) {
  // Check if we're already in pages directory
  const isInPages = window.location.pathname.includes("/pages/");
  const prefix = isInPages ? "" : "pages/";
  window.location.href = `${prefix}product-details.html?id=${productId}`;
}

function addToCart(productId, productName, price, image, quantity = 1) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Check if product already in cart
  const existingItem = cart.find((item) => item.productId === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      productId,
      name: productName,
      price: price,
      quantity: quantity,
      image:
        image ||
        `https://via.placeholder.com/100x100?text=${encodeURIComponent(
          productName.substring(0, 20)
        )}`,
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  showToast(`Added ${productName} to cart!`);
  updateCartCount();
}
function addToCartFromReorder(
  productId,
  productName,
  price,
  image,
  quantity = 1
) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Check if product already exists in cart
  const existingItem = cart.find((item) => item.productId === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      productId,
      name: productName,
      price: price,
      quantity: quantity,
      image:
        image ||
        `https://via.placeholder.com/100x100?text=${encodeURIComponent(
          productName.substring(0, 20)
        )}`,
      reordered: true, // Add flag for reordered items
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  showToast(`${productName} added to cart!`);
  updateCartCount();
}
function updateCartCount() {
  const cartCountElements = document.querySelectorAll(".cart-count");
  if (cartCountElements.length > 0) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElements.forEach((element) => {
      element.textContent = totalItems;
    });
  }
}

function showToast(message, type = "success") {
  // Remove existing toast
  const existingToast = document.querySelector(".toast");
  if (existingToast) {
    existingToast.remove();
  }

  // Create new toast
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

async function checkAuthStatus() {
  const token = localStorage.getItem("token");
  const authButtons = document.querySelector(".auth-buttons");

  if (!authButtons) return;

  if (token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        currentUser = await response.json();
        // Save user to localStorage for other pages
        localStorage.setItem("user", JSON.stringify(currentUser));
        authButtons.innerHTML = `
          <span class="welcome">Welcome, ${currentUser.username}</span>
          <a href="pages/profile.html" class="btn-register">Profile</a>
          <a href="#" onclick="logout()" class="btn-login">Logout</a>
        `;
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        currentUser = null;
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      currentUser = null;
    }
  } else {
    // Clear any stored user data if no token
    localStorage.removeItem("user");
    currentUser = null;
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("cart");
  currentUser = null;
  showToast("Logged out successfully");

  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Redirect functions
function goToPage(page) {
  window.location.href = page;
}

function goToProductDetails(productId) {
  viewProductDetails(productId);
}

// Make functions available globally
window.viewProductDetails = viewProductDetails;
window.addToCart = addToCart;
window.logout = logout;
window.loadProducts = loadProducts;
window.changePage = changePage;
window.performSearch = performSearch;
window.goToPage = goToPage;
window.goToProductDetails = goToProductDetails;
