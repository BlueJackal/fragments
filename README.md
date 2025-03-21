# Fragments Microservice

A minimalist, cloud-based service for storing small pieces of data with CRUD functionality.

## Overview

The **Fragments Microservice** is an API-driven solution for managing small pieces of data called _fragments_. It supports creating and retrieving text-based fragments, with support for image fragments coming in the future.

The microservice is secured via **AWS Cognito**, and only authenticated users are able to access data. This repository contains the code for running the service, setting up its environment, and running tests.

### Key Features

- **CRUD Operations** on user-owned fragments.
- **AWS Cognito** authentication for security.
- **Configurable Logging** levels using Pino (`info`, `debug`, `silent`).
- **CI/CD Integration** by using GitHub actions.

## 1. Installation

1.1 **Clone the Repo**

```bash
git clone https://github.com/BlueJackal/fragments.git
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

All routes except for the `/` route require either `Basic HTTP credentials` or a `JSON Web Token (JWT)` to accompany the request in the `Authorization` header.

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
Content-Length: 27

This is an example fragment
```

**5.1 Supported Fragment Types**

The service now supports creating fragments in the following types:

1. `text/plain`
2. `text/plain; charset=utf-8`
3. `text/markdown`
4. `text/html`
5. `text/csv`
6. `application/json`

Support for image types will be added at a future date.

**5.2 Expanded Fragment Metadata**

Using the `expand=1` query parameter allows retrieving full fragment metadata instead of just IDs:
`GET /v1/fragments?expand=1`

Example response:

```JSON
{
  "status": "ok",
  "fragments": [
    {
      "id": "b9e7a264-630f-436d-a785-27f30233faea",
      "ownerId": "11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a",
      "created": "2021-11-02T15:09:50.403Z",
      "updated": "2021-11-02T15:09:50.403Z",
      "type": "text/plain",
      "size": 256
    },
    {
      "id": "dad25b07-8cd6-498b-9aaf-46d358ea97fe",
      "ownerId": "11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a",
      "created": "2021-11-02T15:09:50.403Z",
      "updated": "2021-11-02T15:09:50.403Z",
      "type": "text/markdown",
      "size": 128
    }
  ]
}
```

**5.3 Fragment Conversions**
Fragments can be converted between compatible formats by using extensions in the URL:

`GET /v1/fragments/:id.ext`

For example, a Markdown fragment can be converted to HTML using .html extension:
`GET /v1/fragments/4dcc65b6-9d57-453a-bd3a-63c107a51698`

Same fragment converted to HTML:

`GET /v1/fragments/4dcc65b6-9d57-453a-bd3a-63c107a51698.html`

**Currently supported conversions:**

`text/markdown` → `text/html`, `text/plain`
`text/html` → `text/plain`
`text/csv` → `text/plain`, `application/json`
`application/json` → `text/plain`, `application/yaml`
Any text/\* type can be returned as text/plain

Attempting unsupported conversions will return a 415 Unsupported Media Type error.

**5.4 Fragment Metadata**
Get metadata for a specific fragment without retrieving its data:
`GET /v1/fragments/:id/info`

Example response:

```JSON
{
  "status": "ok",
  "fragment": {
  "id": "fdf71254-d217-4675-892c-a185a4f1c9b4",
  "ownerId": "11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a",
  "created": "2021-11-02T15:09:50.403Z",
  "updated": "2021-11-02T15:09:50.403Z",
  "type": "text/plain",
  "size": 1024
  }
}
```

**5.5 Updating Fragments**

Update an existing fragment with new data:
`PUT /v1/fragments/:id`

Fragment type cannot be changed after creation. The Content-Type in the request must match the original fragment type.

Example using curl:

```bash
curl -i \
 -X PUT \
 -u user@email.com:password \
 -H "Content-Type: text/plain" \
 -d "This is updated data" \
 http://localhost:8080/v1/fragments/4dcc65b6-9d57-453a-bd3a-63c107a51698
```

**5.6 Deleting Fragments**
Delete an existing fragment:

`DELETE /v1/fragments/:id`

Example using curl:

```bash
curl -i \
 -X DELETE \
 -u user@email.com:password \
 http://localhost:8080/v1/fragments/4dcc65b6-9d57-453a-bd3a-63c107a51698
```

**6. Deployment**
The service is containerized and runs on AWS EC2 using pre-built Docker Hub images. This eliminates the need for manual building on EC2 and simplifies deployment.

You'll need to configure `GitHub Secrets` for the following.

First you'll need your `AWS Details`, which you can find in your AWS console. Alternatively, you can set it up to work with your own provider.

`AWS AWS_ACCESS_KEY_ID` = AKIAIOSFODNN7EXAMPLE

`AWS_SECRET_ACCESS_KEY`= wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

`AWS_SESSION_TOKEN`= AQoEXAMPLEH4aoAH0gNCAPy...

Next, you'll need a DockerHub session token, as well as your DockerHub username as secrets to be able to create and push containers.

`DOCKERHUB_TOKEN`= 3e5caf47-848d-454f-ace6-51d8EXAMPLETOKEN

`DOCKERHUB_USERNAME` = yourDockerHubUsername

7. Testing
   Unit test coverage for fragments is maintained at 80% or above, targeting all expected source files.

To test, type `npm run test` after the server has been installed.

To see test coverage, use `npm run coverage`.
