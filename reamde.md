# 🛍️ StorePilot

> **A modern inventory and order management SaaS for small businesses.**

StorePilot is a full-stack MERN application that helps businesses manage products, inventory, customers, and orders from a single dashboard. The MVP focuses on solving everyday operational challenges for small businesses with a clean, scalable architecture.

---

# 🎯 Project Goal

Build a production-ready SaaS MVP demonstrating:

* Inventory Management
* Order Management
* Customer Management
* Dashboard Analytics
* AI Product Assistance
* Secure Authentication
* Modern MERN Architecture

---

# 👥 Target Users

* Local Businesses
* Online Sellers
* Small Retail Stores
* Startup Brands
* Inventory Managers

---

# ✨ MVP Features

## Authentication

* Register
* Login
* Logout
* JWT Authentication
* Forgot Password
* Reset Password

---

## Product Management

* Create Product
* Edit Product
* Delete Product
* Categories
* SKU
* Price
* Product Images
* Product Description

---

## Inventory Management

* Stock Quantity
* Low Stock Alerts
* Stock Updates
* Inventory History

---

## Customer Management

* Add Customer
* Edit Customer
* Customer Details
* Purchase History

---

## Order Management

* Create Order
* Update Order
* Cancel Order
* Order Details

Order Status

* Pending
* Processing
* Shipped
* Delivered

---

## Dashboard

Display

* Total Revenue
* Total Orders
* Total Products
* Low Stock Products
* Recent Orders

---

## AI Features

Generate

* Product Description
* Product Tags

using OpenAI or Claude API.

---

## Profile

* Update Profile
* Change Password
* Upload Profile Image

---

# 👤 User Roles

### Owner

* Manage Products
* Manage Orders
* Manage Customers
* View Dashboard

### Employee

* Manage Orders
* Update Inventory
* View Products

---

# 🛠 Tech Stack

## Frontend

* React
* Vite
* Tailwind CSS
* shadcn/ui
* React Router DOM
* Axios
* TanStack Query
* React Hook Form
* Zod
* Recharts

---

## Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* JWT
* bcrypt
* Cookie Parser
* Multer
* Cloudinary
* Nodemailer

---

## Deployment

* Frontend → Vercel
* Backend → AWS EC2
* Database → MongoDB Atlas
* Images → Cloudinary
* Reverse Proxy → Nginx
* Process Manager → PM2

---

# 📂 Folder Structure

```text
storepilot/

client/
    src/
        components/
        pages/
        layouts/
        hooks/
        services/
        context/
        utils/

server/
    controllers/
    models/
    routes/
    middlewares/
    services/
    config/
    utils/
    uploads/
```

---

# 🗄 Database Collections

* users
* businesses
* products
* categories
* customers
* orders
* inventoryLogs

---

# 🔐 Authentication Flow

Register

↓

Hash Password

↓

Save User

↓

Login

↓

Generate JWT

↓

Store HTTP-only Cookie

↓

Protected Routes

↓

Access Dashboard

---

# 📊 Dashboard Modules

* Revenue Overview
* Products
* Inventory
* Orders
* Customers
* Low Stock Items

---

# 🚀 Development Phases

### Phase 1

Authentication

### Phase 2

Products

### Phase 3

Inventory

### Phase 4

Customers

### Phase 5

Orders

### Phase 6

Dashboard

### Phase 7

AI Product Generator

### Phase 8

Deployment

---

# 🔮 Future Features

* Multiple Warehouses
* Barcode Scanner
* Supplier Management
* Purchase Orders
* Shipping Integrations
* Finance Module
* Sales Analytics
* AI Demand Forecasting
* Subscription Billing
* Multi-store Management

---

# 🎯 Learning Outcomes

This project demonstrates:

* Full MERN Stack Development
* REST API Design
* JWT Authentication
* MongoDB Data Modeling
* Inventory Management Logic
* Dashboard Analytics
* AI API Integration
* AWS Deployment
* Clean Architecture
* Production-Ready Code Organization
