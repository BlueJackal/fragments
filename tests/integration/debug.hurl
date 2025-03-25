# Debug test to dump the exact response
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Test content`

HTTP/1.1 201
[Captures]
body_content: body
[Asserts]
variable "body_content" exists
