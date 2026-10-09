# Teksture za sto OSCAR iz _src2/trpezarijski-sto-oscar-ts-160x90 -> images/oscar_*.jpg
# Pokretanje: powershell -NoProfile -File tools/crop-oscar.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root '_src2\trpezarijski-sto-oscar-ts-160x90'
$out = Join-Path $root 'images'
function Crop($file, $name, $x, $y, $w, $h) {
  $img = [System.Drawing.Bitmap]::FromFile((Join-Path $src $file))
  $bmp = $img.Clone((New-Object System.Drawing.Rectangle($x, $y, $w, $h)), $img.PixelFormat)
  $bmp.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Jpeg)
  $r = 0; $g = 0; $b = 0; $n = 0
  for ($i = 0; $i -lt $w; $i += 2) { for ($j = 0; $j -lt $h; $j += 2) { $c = $bmp.GetPixel($i, $j); $r += $c.R; $g += $c.G; $b += $c.B; $n++ } }
  Write-Output ("{0}  #{1:x2}{2:x2}{3:x2}  {4} B" -f $name, [int]($r / $n), [int]($g / $n), [int]($b / $n), (Get-Item (Join-Path $out $name)).Length)
  $bmp.Dispose(); $img.Dispose()
}
Crop '2.jpg' 'oscar_top.jpg' 240 319 220 46
Crop '2.jpg' 'oscar_leg.jpg' 194 390 40 230
