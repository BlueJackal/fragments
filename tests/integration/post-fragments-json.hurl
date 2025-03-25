# tests/integration/post-fragments-json.hurl
# Test posting a JSON fragment

# Authenticated POST to /v1/fragments with JSON
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
# JSON data needs to be properly formatted
{
  "name": "Sample",
  "value": 123,
  "active": true
}

# We expect to get back an HTTP 201
HTTP/1.1 201
[Asserts]
jsonpath "$.id" exists
jsonpath "$.type" == "application/json"
# Capture the Location URL but fix the path if needed
[Captures]
fragment_id: jsonpath "$.id"

# Now GET the fragment using the proper URL path
GET http://localhost:8080/v1/fragments/{{fragment_id}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
# Check that we get back the same JSON data
jsonpath "$.name" == "Sample"
jsonpath "$.value" == 123
jsonpath "$.active" == true
