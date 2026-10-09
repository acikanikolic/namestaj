# Isečci iz fotografija vitrine LAVAL (_src2/vitrina-laval-1k-vs1-193) -> images/lavalv_*.jpg
# Pokretanje: powershell -NoProfile -File tools/crop-laval_vitrina.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root '_src2\vitrina-laval-1k-vs1-193'
$out = Join-Path $root 'images'

function Crop($file, $name, $x, $y, $w, $h) {
  $img = [System.Drawing.Bitmap]::FromFile((Join-Path $src $file))
  $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
  $bmp = $img.Clone($rect, $img.PixelFormat)
  $bmp.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Jpeg)
  $r = 0; $g = 0; $b = 0; $n = 0
  for ($i = 0; $i -lt $w; $i += 3) { for ($j = 0; $j -lt $h; $j += 3) { $c = $bmp.GetPixel($i, $j); $r += $c.R; $g += $c.G; $b += $c.B; $n++ } }
  Write-Output ("{0}  #{1:x2}{2:x2}{3:x2}" -f $name, [int]($r / $n), [int]($g / $n), [int]($b / $n))
  $bmp.Dispose(); $img.Dispose()
}

Crop '6.jpg' 'lavalv_oak.jpg' 375 340 225 250     # dekor artisan hrasta (lice vrata)
Crop '3.jpg' 'lavalv_in.jpg'  345 335 115 80      # unutrašnjost korpusa
Crop '6.jpg' 'lavalv_blk.jpg' 150 470 190 110     # crni dekor (letvice)
Crop '2.jpg' 'lavalv_glass.jpg' 352 95 85 60      # staklo (prosečna boja)
