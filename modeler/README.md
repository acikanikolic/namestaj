# Aki Modeler

Samostalna aplikacija (jedan HTML fajl) koja iz **fotografija i dimenzija** pravi 3D model (GLB).
Radi potpuno **offline**: nema spoljnih biblioteka, servera ni API-ja. Dovoljno je dvaput kliknuti na `aki-modeler.html`.

## Upotreba
1. Unesite naziv i dimenzije (širina, dubina, visina u cm).
2. Dodajte fotografije: prednja (obavezna), bočna, gornja, zadnja (opciono). Najbolje su pravi snimci na jednobojnoj svetloj pozadini.
3. Izaberite kvalitet mreže, kliknite **Napravi model**, pregledajte (mreža dugme prikazuje trouglove) i **Preuzmi GLB**.

## Kako radi
- Pozadina se prepoznaje po boji ivice slike. Siluete prednje, bočne i gornje fotografije se presecaju u zapremini zadatih dimenzija (voxeli, „visual hull“).
- Površina se spaja u mrežu (greedy meshing), a fotografije se projektuju kao tekstura. Strane bez svoje fotografije koriste najbližu dostupnu.
- Izlaz je GLB: metri, Y gore, prednja strana +Z, ishodište u sredini poda, spreman za `room.html` i `<model-viewer>`.

## Ograničenja
- Unutrašnjost i udubljenja koja se ne vide u siluetama (fioke, niše) nisu geometrija, nego slika na teksturi.
- Snimci pod uglom (perspektiva) daju lošiju siluetu. Krive linije su stepenaste (zavisi od kvaliteta mreže).
- Beli proizvod na beloj pozadini: podesite „Osetljivost pozadine“ ili isključite „Providne rupe“.
