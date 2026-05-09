$ErrorActionPreference = 'SilentlyContinue'
$response = Invoke-WebRequest -Uri 'http://localhost:3002' -TimeoutSec 10 -UseBasicParsing
$response.StatusCode
$response.Content.Length
$response.Content.Substring(0, 200)