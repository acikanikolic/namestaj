# Teksture za model ormara HANA iz fotografija u _src2/ormar-hana-4k2f2o/ -> images/hana_*.jpg
# Pokretanje: powershell -NoProfile -File tools/crop-hana.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root '_src2\ormar-hana-4k2f2o'
$out = Join-Path $root 'images'
$jpg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }

function Crop($file, $name, $x, $y, $w, $h, $rotate, $maxLong) {
  $img = [System.Drawing.Bitmap]::FromFile((Join-Path $src $file))
  $crop = $img.Clone((New-Object System.Drawing.Rectangle($x, $y, $w, $h)), [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  if ($rotate) { $crop.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
  $cw = $crop.Width; $ch = $crop.Height
  $k = [Math]::Min(1.0, $maxLong / [Math]::Max($cw, $ch))
  $nw = [int][Math]::Max(8, $cw * $k); $nh = [int][Math]::Max(8, $ch * $k)
  $bmp = New-Object System.Drawing.Bitmap($nw, $nh)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.DrawImage($crop, 0, 0, $nw, $nh); $g.Dispose()
  $path = Join-Path $out $name
  foreach ($q in 85, 75, 65, 55, 45, 35) {
    $ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$q)
    $bmp.Save($path, $jpg, $ep)
    if ((Get-Item $path).Length -le 60000) { break }
  }
  $r = 0; $gg = 0; $b = 0; $n = 0
  for ($i = 0; $i -lt $nw; $i += 2) { for ($j = 0; $j -lt $nh; $j += 2) { $c = $bmp.GetPixel($i, $j); $r += $c.R; $gg += $c.G; $b += $c.B; $n++ } }
  Write-Output ("{0}  {1}x{2}  {3} B  #{4:x2}{5:x2}{6:x2}" -f $name, $nw, $nh, (Get-Item $path).Length, [int]($r / $n), [int]($gg / $n), [int]($b / $n))
  $bmp.Dispose(); $crop.Dispose(); $img.Dispose()
}

# drvo sonoma hrast: vertikalni dezen sa spoljnog krila (bez ručke), isti isečak zarotiran za horizontalne ploče
Crop '1.jpg' 'hana_door.jpg' 203 56 72 478 $false 512
Crop '1.jpg' 'hana_wood_h.jpg' 203 56 72 478 $true 512
# ogledalo (središnje krilo) i unutrašnja zadnja strana
Crop '1.jpg' 'hana_mirror.jpg' 324 90 46 320 $false 320
Crop '3.jpg' 'hana_back.jpg' 330 180 140 220 $false 128
