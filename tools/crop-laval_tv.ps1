# Teksture za LAVAL TV iz _src2/tv-polica-laval-tv-131-2k2v/ -> images/lavaltv_*.jpg
# Pokretanje: powershell -NoProfile -File tools/crop-laval_tv.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root '_src2\tv-polica-laval-tv-131-2k2v'
$out = Join-Path $root 'images'

function Crop($file, $name, $x, $y, $w, $h) {
  $img = [System.Drawing.Bitmap]::FromFile((Join-Path $src $file))
  $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
  $bmp = $img.Clone($rect, $img.PixelFormat)
  $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $p = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]82)
  $bmp.Save((Join-Path $out $name), $enc, $p)
  $r = 0; $g = 0; $b = 0; $n = 0
  for ($i = 0; $i -lt $w; $i += 3) { for ($j = 0; $j -lt $h; $j += 3) { $c = $bmp.GetPixel($i, $j); $r += $c.R; $g += $c.G; $b += $c.B; $n++ } }
  Write-Output ("{0}  #{1:x2}{2:x2}{3:x2}" -f $name, [int]($r / $n), [int]($g / $n), [int]($b / $n))
  $bmp.Dispose(); $img.Dispose()
}

Crop '1.jpg'  'lavaltv_oak.jpg'   165 378 140 125
Crop '7.jpg'  'lavaltv_top.jpg'   100 190 512 46
Crop '7.jpg'  'lavaltv_slat.jpg'  346 260 16 320
Crop '7.jpg'  'lavaltv_black.jpg' 225 260 40 300
