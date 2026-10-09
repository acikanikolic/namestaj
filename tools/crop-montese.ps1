# Teksture za klub sto MONTESE iz _src2/klub-sto-montese-90x50
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root '_src2\klub-sto-montese-90x50'
$out = Join-Path $root 'images'
function Crop($file, $name, $x, $y, $w, $h) {
  $img = [System.Drawing.Bitmap]::FromFile((Join-Path $src $file))
  $bmp = $img.Clone((New-Object System.Drawing.Rectangle($x, $y, $w, $h)), $img.PixelFormat)
  $bmp.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Jpeg)
  $r = 0; $g = 0; $b = 0; $n = 0
  for ($i = 0; $i -lt $w; $i += 3) { for ($j = 0; $j -lt $h; $j += 3) { $c = $bmp.GetPixel($i, $j); $r += $c.R; $g += $c.G; $b += $c.B; $n++ } }
  Write-Output ("{0}  #{1:x2}{2:x2}{3:x2}" -f $name, [int]($r / $n), [int]($g / $n), [int]($b / $n))
  $bmp.Dispose(); $img.Dispose()
}
Crop '3.jpg' 'montese_top.jpg'   300 262 400 40
Crop '2.jpg' 'montese_apron.jpg' 330 315 330 80
Crop '2.jpg' 'montese_white.jpg'  205 330 80 200
