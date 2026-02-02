# CodeAlpha: Simple E-Commerce Store

This is a full-stack e-commerce web application developed as part of the **CodeAlpha Full Stack Development Internship**. It features a backend built with Node.js and Express, a MongoDB database for product storage, and a frontend interface to browse products.

## 🚀 Key Features

The application is built with a dual-interface architecture, providing distinct experiences for customers and store administrators.

### 👤 User (Customer) Features

* **Authentication & Security:** Secure User Login and Registration system.

* **Product Discovery:** Advanced search functionality and categorized product viewing.

* **Shopping Experience:** Seamless "Add to Cart" functionality and real-time cart management.

* **Order Management:** Streamlined checkout process with automated order placement.

* **Personal Dashboard:** Dedicated user profile to manage personal details and track historical orders.

### 🔑 Admin (Management) Features

* **Administrative Control:** Secure Admin Login specifically for store management.

* **Full CRUD Operations:** Complete authority to Create, Read, Update, and Delete entries for Products, Users, and Orders.

* **Business Analytics:** Integrated analytics dashboard providing insights into sales performance, user growth, and inventory status.

* **Order Oversight:** Ability to monitor and update the status of all customer transactions.
  
## 🛠️ Tech Stack
* **Frontend:** HTML, CSS, JavaScript
* **Backend:** Node.js, Express.js
* **Database:** MongoDB
* **Environment:** Python (for local frontend hosting)

## 📦 Project Setup & Installation

Follow these steps to get the project running on your local machine.

### 1. Start MongoDB
Open a terminal and run your local MongoDB server:
```bash
"C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath="mongodb_data\db" --port 27017
```
### 2. Configure Backend & Seed Database
Open a new terminal, navigate to the backend folder, install dependencies, and seed the initial product data:

```bash
cd backend
npm install
node seed.js
```
### 3. Run the Backend Server
Start the development server using the following command:

```bash
npm run dev
```
### 4. Serve the Frontend
Since the frontend uses JavaScript modules/requests, serve it using Python's HTTP server. Open a new terminal in the root directory:

```bash
python -m http.server 5500
```
### 5. Access the Application
Open your browser and navigate to: http://localhost:5500/frontend/

## 👤 Author

## Ahmed Abdul Rehman Butt

#### www.linkedin.com/in/ahmed-butt-at89

#### https://github.com/ahmedbutt09
