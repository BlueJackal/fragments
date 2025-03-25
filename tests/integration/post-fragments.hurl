# tests/integration/post-fragments.hurl
# Authenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments
# We're sending a plain text fragment
Content-Type: text/plain
# Include HTTP Basic Auth credentials
[BasicAuth]
user1@email.com:password1
# Body of the request goes in ```...``` when it's a string
`This is a fragment!`

# We expect to get back an HTTP 201
HTTP/1.1 201
# We have various assertions about the response that we want to check
[Asserts]
# We don't check the specific format of the Location header
header "Location" exists
# Check for the ID and other properties directly in the root JSON
jsonpath "$.id" exists
jsonpath "$.ownerId" exists
jsonpath "$.created" isString
jsonpath "$.updated" isString
jsonpath "$.type" == "text/plain"
jsonpath "$.size" == 19
# Capture the fragment ID
[Captures]
fragment_id: jsonpath "$.id"

# 2. Try to GET the fragment we just posted by its URL
GET http://localhost:8080/v1/fragments/{{fragment_id}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: text/plain
[Asserts]
body == "This is a fragment!"
