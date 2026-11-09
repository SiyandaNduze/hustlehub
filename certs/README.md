# Local SSL certificate

HustleHub is served over HTTPS even in development. Generate a **self-signed**
certificate (development only) from the project root:

```bash
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout certs/key.pem \
  -out certs/cert.pem \
  -days 365 \
  -subj "/CN=localhost"
```

**Windows / Git Bash:** Git Bash rewrites `/CN=localhost` into a file path. Use
`-subj "//CN=localhost"` or prefix the command with `MSYS_NO_PATHCONV=1`.
PowerShell and cmd.exe do not have this problem.

`key.pem` is a private key and is git-ignored - never commit it.

## Browser and Postman warnings

A self-signed certificate is not trusted by default. That is expected locally:
- **Browser:** click *Advanced -> Proceed to localhost* once.
- **Postman:** Settings -> General -> turn off *SSL certificate verification*.
- **Newman:** the `npm run test:api` script already passes `--insecure`.

In production a certificate from a trusted CA (e.g. Let's Encrypt) replaces this one.

## Windows / Git Bash note

Git Bash rewrites `/CN=localhost` into a Windows path. Use a double slash instead:

```bash
openssl req -x509 -newkey rsa:2048 -nodes -keyout certs/key.pem -out certs/cert.pem -days 365 -subj "//CN=localhost"
```
