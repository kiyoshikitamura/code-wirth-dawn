$srcDir = "C:\Users\scope\.gemini\antigravity\brain\41657a1b-03c5-4d77-9aae-87b69c33e6d3"
$outDir = "d:\dev\code-wirth-dawn\public\images\items"
$script = "d:\dev\code-wirth-dawn\scripts\resize_icon.ps1"

Get-ChildItem -Path "$srcDir\*.png" | ForEach-Object {
    if ($_.Name -match '^(item|book|skill|sword|grimoire|manual|scroll|gear|acc|tool)_(.+)_\d{13}\.png$') {
        $prefix = $matches[1]
        $body = $matches[2]
        $outName = "${prefix}_${body}.png"
        $outPath = Join-Path $outDir $outName
        if (-not (Test-Path $outPath)) {
            & $script -src $_.FullName -dst $outPath
        }
    }
}
Write-Host "Batch resize complete."
