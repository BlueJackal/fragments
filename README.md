# Fragments Microservice

> *A minimalist, cloud-based service for storing small pieces of data — text or images — with CRUD functionality*

---
## Overview

The **Fragments Microservice** is an API-driven solution for managing small pieces of data called *fragments*. It supports creating and retrieving text-based fragments, with support for image fragments coming in the future.

The microservice is secured via **AWS Cognito**, and only authenticated users are able to access data. This repository contains the code for running the service, setting up its environment, and running tests.

### Key Features
- **CRUD Operations** on user-owned fragments.
- **AWS Cognito** authentication for security.
- **Configurable Logging** levels using Pino (`info`, `debug`, `silent`).
- **CI/CD Integration** by using GitHub actions.

---

## 1. Installation

1.1 **Clone the Repo**  
   ```bash
   git clone https://github.com/<YourUserName>/fragments.git
   cd fragments
   ```

1.2 **Install Dependencies**
  ```bash
   npm install
   ```

1.3 **Create a .env file**
  Copy the below example into your project root, and add your own AWS IDs and URLs:
  ```bash
   # port to use when starting the server
  PORT=8080
  
  # url for deployed location headers
  # API_URL=[insert ipv4 address and port here]
  
  # url for local location headers
  API_URL=http://localhost:8080
  
  # which log messages to show (usually `info` for production, 
  # `debug` for development, `silent` to disable)
  LOG_LEVEL=debug
  
  # AWS Amazon Cognito User Pool ID (use your User Pool ID)
  AWS_COGNITO_POOL_ID=us-east-1_xxxxxxxxx
  
  # AWS Amazon Cognito Client App ID (use your Client App ID)
  AWS_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

1.4 **Start the Server**
  ```bash
   npm start
   ```

---

1. **API Versioning**
All routes in the first version of fragments begin with `/v1/*`. This allows us to secure everything beyond that route with our bearer token middleware, and also to retain support for older version in the future.

---

## 2. Example Responses

2.1 **Health Check**
  Visit the base URL for your service.
  ```bash
   http://localhost:8080
   ```
  Example response (message configurable in `src/routes/index.js`)**
  ```json
   {
  "status": "ok",
  "author": "Christopher Simon",
  "githubUrl": "https://github.com/BlueJackal/fragments",
  "version": "0.0.1"
  }
   ```
2.2 **Example Error Response**


---

## 3. API

1. **Creating a Fragment**
Using curl as an example as an example.
```bash
POST /v1/fragments
Host: localhost:8080
Content-type: text/plain
Authorization: Bearer <User ID token>

Hello World!
```
  
