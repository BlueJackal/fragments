# tests/integration/lab10-dynamodb.hurl
# Integration test for DynamoDB functionality

# Step 1: POST a new JSON fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
{
  "service": "DynamoDB"
}

# Confirm 201 status and capture Location header and fragment id
HTTP/1.1 201
[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.id"

# Verify the response has the expected fragment properties
[Asserts]
jsonpath "$.id" exists
jsonpath "$.ownerId" exists
jsonpath "$.type" == "application/json"
jsonpath "$.size" == 27
jsonpath "$.created" exists
jsonpath "$.updated" exists

# Step 2: GET the fragment info (metadata) using the /v1 route path
GET http://localhost:8080/v1/fragments/{{fragment1_id}}/info
[BasicAuth]
user1@email.com:password1

# Confirm 200 status and metadata properties
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == {{fragment1_id}}
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 27
jsonpath "$.fragment.created" exists
jsonpath "$.fragment.updated" exists

# Step 3: POST a second Markdown fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1
`DynamoDB is **great**.`

# Confirm 201 status and capture Location header and fragment id
HTTP/1.1 201
[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.id"

# Verify the response has the expected fragment properties
[Asserts]
jsonpath "$.id" exists
jsonpath "$.ownerId" exists
jsonpath "$.type" == "text/markdown"
jsonpath "$.size" == 22
jsonpath "$.created" exists
jsonpath "$.updated" exists

# Step 4: GET the second fragment info (metadata)
GET http://localhost:8080/v1/fragments/{{fragment2_id}}/info
[BasicAuth]
user1@email.com:password1

# Confirm 200 status and metadata properties
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == {{fragment2_id}}
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 22
jsonpath "$.fragment.created" exists
jsonpath "$.fragment.updated" exists

# Step 5: GET all fragments for the user (IDs only)
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

# Confirm 200 status and that the fragments list includes both fragment IDs
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" includes {{fragment1_id}}
jsonpath "$.fragments" includes {{fragment2_id}}

# Step 6: DELETE the first fragment
DELETE http://localhost:8080/v1/fragments/{{fragment1_id}}
[BasicAuth]
user1@email.com:password1

# Confirm 200 status
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"

# Step 7: Try to GET the deleted fragment
GET http://localhost:8080/v1/fragments/{{fragment1_id}}
[BasicAuth]
user1@email.com:password1

# Confirm 404 status
HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"

# Step 8: GET all fragments again
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

# Confirm 200 status and that only the second fragment remains
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" not includes {{fragment1_id}}
jsonpath "$.fragments" includes {{fragment2_id}}
