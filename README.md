# Fragments Microservice

A minimalist, cloud-based service for storing small pieces of data with CRUD functionality.


## Overview

The **Fragments Microservice** is an API-driven solution for managing small pieces of data called *fragments*. It supports creating and retrieving text-based fragments, with support for image fragments coming in the future.

The microservice is secured via **AWS Cognito**, and only authenticated users are able to access data. This repository contains the code for running the service, setting up its environment, and running tests.

### Key Features
- **CRUD Operations** on user-owned fragments.
- **AWS Cognito** authentication for security.
- **Configurable Logging** levels using Pino (`info`, `debug`, `silent`).
- **CI/CD Integration** by using GitHub actions.



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



## 1. **API Versioning**

All routes in the first version of fragments begin with `/v1/*`. 

This allows us to secure everything beyond that route with bearer token middleware, and also to keep support for older version in the future.



## 2. **Authentication**


All routes except for the ` / ` route require either `Basic HTTP credentials` or a `JSON Web Token (JWT)` to accompany the request in the `Authorization` header.

```bash
curl -u chris.m.simon1@gmail.com:userpassword http://localhost:8080/v1/fragments
```



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

An error response will use an appropriate HTTP `4xx` client error or `5xx` server error. It will include an `error` object, which has both the error `code` and a human-readable `error message` as a string.

```json
{
  "status": "error",
  "error": {
    "code": 404,
    "message": "Fragment not found"
  }
}
```




## 4. API
---

4.1 **Health Check**
  The `/` route is unauthenticated and available for checking the health of the service. If the service is running, it returns an HTTP `200` status.
  ```bash
   http://localhost:8080
   ```

**Example response (message configurable in `src/routes/index.js`)**
  ```json
  {
  "status": "ok",
  "author": "Christopher Simon",
  "githubUrl": "https://github.com/BlueJackal/fragments",
  "version": "0.0.1"
  }
   ```
**Example using `curl`**
```bash
$ curl -i http://localhost:8080

HTTP/1.1 200 OK
Cache-Control: no-cache
Content-Type: application/json; charset=utf-8

{"status":"ok","author":"Christopher Simon <Chris.m.simon1@gmail.com>","githubUrl":"https://github.com/BlueJackal/fragments","version":"0.0.1"}

```

**4.2 Creating a Fragment with `POST`**
Using curl as an example. At the moment, fragments only support the `text/plain` data type.
```bash
POST /v1/fragments
Host: localhost:8080
Content-type: text/plain
Authorization: Bearer <User ID token>

Hello World!
```

**4.2.1 Example using `curl`**
```bash
curl -i \
  -X POST \
  -u chris.m.simon1@gmail.com:userpassword \
  -H "Content-Type: text/plain" \
  -d "This is a fragment" \
  http://localhost/v1/fragments

HTTP/1.1 201 Created
Location: https://localhost:8080/v1/fragments/30a84843-0cd4-4975-95ba-b96112aea189
Content-Type: application/json; charset=utf-8
Content-Length: 187

{
  "status": "ok",
  "fragment": {
    "id": "30a84843-0cd4-4975-95ba-b96112aea189",
    "created": "2021-11-08T01:04:46.071Z",
    "updated": "2021-11-08T01:04:46.073Z",
    "ownerId": "11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a",
    "type": "text/plain",
    "size": 18
  }
}
```

**4.2.2 Response**
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

**4.3 Retrieving a Fragment with `GET`**
Users can only retrieve thier own fragments. If a user has no fragments, an empty array `[]` is returned.

**4.3.1 Retrieving fragments with curl:**

```bash
curl -i -u chris.m.simon1@gmail.com:userpassword http://localhost:8080/v1/fragments

HTTP/1.1 200 OK

{
  "status": "ok",
  "fragments": [
    "4dcc65b6-9d57-453a-bd3a-63c107a51698",
    "30a84843-0cd4-4975-95ba-b96112aea189"
  ]
}
```

**4.3.2 Retrieve a specific fragment**

Users are able to retrieve a specific fragment belonging to them by searching for the id.

```bash
curl -i -u chris.m.simon1@gmail.com:userpassword http://localhost:8080/v1/fragments/4dcc65b6-9d57-453a-bd3a-63c107a51698

HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: 26

Here's an example fragment
```
  
