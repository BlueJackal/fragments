# Fragments Microservice

*A minimalist, cloud-based service for storing small pieces of data — text or images — with CRUD functionality*


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

1.3 **Create a `.env` file**
  Copy the below example into your project root. Add your own AWS IDs and URLs:
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

## 1. **API Versioning**

All routes in the first version of fragments begin with `/v1/*`. 

This allows us to secure everything beyond that route with bearer token middleware, and also to keep support for older version in the future.

---

## 2. **Authentication**

All routes except for the ` / ` route require either `Basic HTTP credentials` or a `JSON Web Token (JWT)` to accompany the request in the `Authorization` header.

```bash
curl -u email:password https://fragments-api.com/v1/fragments
```

---

## 3. Responses

Most responses are returned in `JSON` format ( `application/json` ) unless otherwise specified.

Responses also include an extra `status` property, which indecates whether the request was successful (for example `ok` or `error`).
  
## 3.1 Example: Successful response

A successful response will always include an HTTP `2xx` status, as well as a `"status" : "ok"` property/value.

```json
{
   "status": "ok"
}
```

If the response includes other data, it will be included. 

```json
{
  "status": "ok",
  "fragment": {
    "id": "30a84843-0cd4-4975-95ba-b96112aea189",
    "ownerId": "11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a",
    "created": "2021-11-02T15:09:50.403Z",
    "updated": "2021-11-02T15:09:50.403Z",
    "type": "text/plain",
    "size": 256
  }
}
```

3.2 **Example Error Response**


---

## 4. API

2.1 **Health Check**
  The `/` route is unauthenticated and available for checking the health of the service. If the service is running, it returns an HTTP `200` status.
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

1. **Creating a Fragment**
Using curl as an example as an example.
```bash
POST /v1/fragments
Host: localhost:8080
Content-type: text/plain
Authorization: Bearer <User ID token>

Hello World!
```


  
