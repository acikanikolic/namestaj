# Teksture za komodu MARRON iz _src2/komoda-marron-157-3k3f3v/ -> images/marron_*.jpg
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root '_src2\komoda-marron-157-3k3f3v'
$out = Join-Path $root 'images'

function Crop($file, $name, $x, $y, $w, $h) {
  $img = [System.Drawing.Bitmap]::FromFile((Join-Path $src $file))
  $bmp = $img.Clone((New-Object System.Drawing.Rectangle($x, $y, $w, $h)), $img.PixelFormat)
  $bmp.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Jpeg)
  $r = 0; $g = 0; $b = 0; $n = 0
  for ($i = 0; $i -lt $w; $i += 2) { for ($j = 0; $j -lt $h; $j += 2) { $c = $bmp.GetPixel($i, $j); $r += $c.R; $g += $c.G; $b += $c.B; $n++ } }
  Write-Output ("{0}  #{1:x2}{2:x2}{3:x2}" -f $name, [int]($r / $n), [int]($g / $n), [int]($b / $n))
  $bmp.Dispose(); $img.Dispose()
}

Crop '1.jpg' 'marron_bez.jpg'   200 395 160 50   # kašmir dekor (front)
Crop '1.jpg' 'marron_crna.jpg'  200 372 160 10   # crna mat letva
Crop '3.jpg' 'marron_unutra.jpg' 200 395 170 60  # unutrašnjost korpusa (senka)
