# Teksture za GALAXY garnituru iz fotografija u _src2/ugaona-garnitura-galaxy-1/
# Pokretanje: powershell -NoProfile -File tools/crop-galaxy.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root '_src2\ugaona-garnitura-galaxy-1'
$out = Join-Path $root 'images'

function Crop($file, $name, $x, $y, $w, $h) {
  $img = [System.Drawing.Bitmap]::FromFile((Join-Path $src $file))
  $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
  $bmp = $img.Clone($rect, $img.PixelFormat)
  $bmp.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Jpeg)
  $r = 0; $g = 0; $b = 0; $n = 0
  for ($i = 0; $i -lt $w; $i += 2) { for ($j = 0; $j -lt $h; $j += 2) { $c = $bmp.GetPixel($i, $j); $r += $c.R; $g += $c.G; $b += $c.B; $n++ } }
  Write-Output ("{0}  #{1:x2}{2:x2}{3:x2}" -f $name, [int]($r / $n), [int]($g / $n), [int]($b / $n))
  $bmp.Dispose(); $img.Dispose()
}

Crop '1.jpg' 'galaxy_front.jpg'  400 412 300 42   # bočna strana sanduka (štof)
Crop '1.jpg' 'galaxy_pillow.jpg' 320 312 90 70    # jastuk naslona
Crop '1.jpg' 'galaxy_seat.jpg'   380 392 260 14   # gornja strana sedišta
Crop '1.jpg' 'galaxy_arm.jpg'    660 385 60 12    # rukohvat
Crop '1.jpg' 'galaxy_foot.jpg'   694 492 28 8     # nožica
