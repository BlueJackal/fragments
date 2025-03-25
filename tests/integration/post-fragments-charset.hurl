# tests/integration/post-fragments-charset.hurl
# Test posting a fragment with a charset in the content type

# Authenticated POST to /v1/fragments with charset
POST http://localhost:8080/v1/fragments
Content-Type: text/plain; charset=utf-8
[BasicAuth]
user1@email.com:password1
`Hello with charset!`

# We expect to get back an HTTP 201
HTTP/1.1 201
[Asserts]
# Server strips the charset part, so we just check for text/plain
jsonpath "$.type" == "text/plain"
jsonpath "$.id" exists
# Capture the fragment ID instead of the full URL
[Captures]
fragment_id: jsonpath "$.id"

# Now GET the fragment using the proper URL path
GET http://localhost:8080/v1/fragments/{{fragment_id}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
body == "Hello with charset!"
