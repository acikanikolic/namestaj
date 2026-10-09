# Isečci tekstura za Regal GLEN iz _src2/regal-glen/1.jpg -> images/glen_*.jpg
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root '_src2\regal-glen'
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

Crop '1.jpg' 'glen_oak.jpg'  275 108 215 60    # sivi hrast (vodoravne žice)
Crop '1.jpg' 'glen_oakv.jpg' 272 292 95 92     # sivi hrast (niša kule)
Crop '1.jpg' 'glen_white.jpg' 250 548 340 38   # opak bela (front)
