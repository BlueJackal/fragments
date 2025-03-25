# tests/integration/post-fragments-unsupported-type.hurl
# Test posting a fragment with an unsupported content type

# Authenticated POST to /v1/fragments with unsupported type
POST http://localhost:8080/v1/fragments
Content-Type: image/png
[BasicAuth]
user1@email.com:password1
# A binary image would go here, but text works to trigger the error
`This is not a supported fragment type!`

# We expect to get back an HTTP 415 (Unsupported Media Type)
HTTP/1.1 415
