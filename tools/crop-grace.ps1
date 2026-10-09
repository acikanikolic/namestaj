# Teksture za GRACE barsku stolicu iz _src2/barska-stolica-grace/ -> images/grace_*.jpg
# Pokretanje: powershell -NoProfile -File tools/crop-grace.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root '_src2\barska-stolica-grace'
$out = Join-Path $root 'images'

function Crop($file, $name, $x, $y, $w, $h) {
  $img = [System.Drawing.Bitmap]::FromFile((Join-Path $src $file))
  $bmp = $img.Clone((New-Object System.Drawing.Rectangle($x, $y, $w, $h)), $img.PixelFormat)
  $bmp.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Jpeg)
  $r = 0; $g = 0; $b = 0; $n = 0
  for ($i = 0; $i -lt $w; $i += 3) { for ($j = 0; $j -lt $h; $j += 3) { $c = $bmp.GetPixel($i, $j); $r += $c.R; $g += $c.G; $b += $c.B; $n++ } }
  Write-Output ("{0}  #{1:x2}{2:x2}{3:x2}  {4} B" -f $name, [int]($r / $n), [int]($g / $n), [int]($b / $n), (Get-Item (Join-Path $out $name)).Length)
  $bmp.Dispose(); $img.Dispose()
}

Crop '3.jpg' 'grace_back.jpg' 300 50 230 50     # naslon (štof, pozadi)
Crop '2.jpg' 'grace_seat.jpg' 330 148 150 34    # sedište (štof, spreda)
