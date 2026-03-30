param([string]$src, [string]$dst)
[Reflection.Assembly]::LoadWithPartialName("System.Drawing") | Out-Null
$img = [System.Drawing.Image]::FromFile($src)
$bmp = new-object System.Drawing.Bitmap 256, 256
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, 256, 256)
$g.Dispose()
$bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$img.Dispose()
Write-Host "Resized and saved: $dst"
