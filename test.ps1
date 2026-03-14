$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Web

$ie = New-Object -ComObject InternetExplorer.Application
$ie.Visible = $false
$ie.Navigate("file:///C:/Users/MANI/OneDrive/Desktop/mani%20hack/LUMINA/index.html")

while ($ie.Busy -eq $true) { Start-Sleep -Milliseconds 100 }
Start-Sleep -Seconds 2

$doc = $ie.Document
$window = $doc.parentWindow
try {
    $window.execScript("console.log = function(msg) { window.lastError = msg; }; window.onerror = function(msg) { window.lastError = 'ERR: ' + msg; }; showPage('watchdog');", "javascript")
    Start-Sleep -Seconds 1
    Write-Host $window.lastError
} catch {
    Write-Host $_.Exception.Message
}
$ie.Quit()
