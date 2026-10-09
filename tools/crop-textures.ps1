# Pravi teksture (isečke) iz fotografija proizvoda u _src2/ i upisuje ih u images/.
# Pokretanje: powershell -File tools/crop-textures.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root '_src2'
$out = Join-Path $root 'images'

function Crop($file, $name, $x, $y, $w, $h) {
  $img = [System.Drawing.Bitmap]::FromFile((Join-Path $src $file))
  $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
  $bmp = $img.Clone($rect, $img.PixelFormat)
  $bmp.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Jpeg)
  # prosečna boja
  $r = 0; $g = 0; $b = 0; $n = 0
  for ($i = 0; $i -lt $w; $i += 3) { for ($j = 0; $j -lt $h; $j += 3) { $c = $bmp.GetPixel($i, $j); $r += $c.R; $g += $c.G; $b += $c.B; $n++ } }
  Write-Output ("{0}  #{1:x2}{2:x2}{3:x2}" -f $name, [int]($r / $n), [int]($g / $n), [int]($b / $n))
  $bmp.Dispose(); $img.Dispose()
}

Crop 'mohito-1.jpg'  'm_top.jpg'      250 62 310 30
Crop 'mohito-1.jpg'  'm_leg.jpg'      405 180 12 60
Crop 'simple-2.jpg'  'c_seat.jpg'     310 310 190 60
Crop 'simple-2.jpg'  'c_back.jpg'     335 65 135 235
Crop 'loalti-1.jpg'  's_back.jpg'     170 292 465 110
Crop 'loalti-1.jpg'  's_seat.jpg'     135 412 535 66
Crop 'loalti-1.jpg'  's_base.jpg'     140 484 525 44
Crop 'loalti-1.jpg'  's_arm.jpg'      88 380 50 130
Crop 'loalti-1.jpg'  's_pillow.jpg'   150 322 90 80
