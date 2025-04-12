# tests/integration/lab9-integration.hurl
# Integration test for S3 storage functionality

# Step 1: POST a new text fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Hello S3!`

# Check that the server returns a 201 Created status
HTTP/1.1 201
# Verify we get a proper Location header and capture it
[Captures]
url: header "Location"
fragment_id: jsonpath "$.id"

# Verify the response has the expected fragment properties
[Asserts]
jsonpath "$.id" exists
jsonpath "$.type" == "text/plain"
jsonpath "$.size" == 9

# Step 2: GET the fragment we just created
# Make sure to use /v1/fragments/ prefix
GET http://localhost:8080/v1/fragments/{{fragment_id}}
[BasicAuth]
user1@email.com:password1

# Verify we get a 200 OK response with the correct fragment data
HTTP/1.1 200
Content-Type: text/plain

# Verify that the response body matches what we posted
[Asserts]
body == "Hello S3!"

# Step 3: DELETE the fragment
DELETE http://localhost:8080/v1/fragments/{{fragment_id}}
[BasicAuth]
user1@email.com:password1

# Verify we get a 200 OK in response to the DELETE
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"

# Step 4: Try to GET the fragment again, which should fail with 404
GET http://localhost:8080/v1/fragments/{{fragment_id}}
[BasicAuth]
user1@email.com:password1

# Verify we get a 404 Not Found, since the fragment is now deleted
HTTP/1.1 404
# Note: We're only checking for the status code, 
# not asserting on the exact structure of the error response
