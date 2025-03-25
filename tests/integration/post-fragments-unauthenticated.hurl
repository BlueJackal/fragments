# tests/integration/post-fragments-unauthenticated.hurl
# Test posting a fragment without authentication

# Unauthenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
`This request has no authentication`

# We expect to get back an HTTP 401 (Unauthorized)
HTTP/1.1 401
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 401
