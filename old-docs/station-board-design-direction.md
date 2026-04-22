# Station Board Design Direction

## Goal

`Station Board` üretim tarafının operasyon ekranıdır.

Bu ekranın temel işi:

1. istasyona düşen ticket’ları göstermek
2. hazırlık akışını netleştirmek
3. gecikmeleri görünür kılmak
4. operatörü gereksiz bilgiyle boğmadan aksiyon aldırmak

## Product Character

Hedef his:

- yüksek kontrast
- sert ve net
- uzaktan okunabilir
- eldivenli/yoğun kullanımda bile anlaşılır

Bu yüzey “şık admin panel” gibi değil, canlı üretim panosu gibi davranmalıdır.

## Surface Variants

Bu ekran tek bir şey değildir; istasyon türüne göre farklı varyantlara ayrılır:

- `Kitchen Board`
- `Barista Board`
- `Bar Board`
- `Hookah Board`
- `Fastfood Board`
- `Dispatch Board`

Ürün dili ana kavram olarak `Station Board` kullanmalı, ekran başlığı ise istasyon adına göre değişebilir.

## Primary Structure

### Single Station View

Default kullanım:

- operatör sadece kendi istasyonunu görür
- tek istasyon
- üç kolon

```text
+---------------------------------------------------------------+
| Barista Board | New 4 | Preparing 3 | Ready 2 | Alerts 1     |
+----------------------+------------------+---------------------+
| New                  | Preparing        | Ready               |
| ticket               | ticket           | ticket              |
| ticket               | ticket           | ticket              |
| ticket               | ticket           | ticket              |
+----------------------+------------------+---------------------+
```

### Supervisor View

Supervisor veya admin için:

- istasyon sekmeleri
- seçili istasyon panosu
- opsiyonel çoklu istasyon özeti

## Ticket Card Model

Her ticket kartında görünmesi gerekenler:

- masa numarası
- sipariş kimliği
- ürün adı
- adet
- ürün notu
- sipariş notu
- geçen süre

Opsiyonel:

- operatör ataması
- SLA etiketi

## Ticket Status Columns

MVP:

- `new`
- `preparing`
- `ready`

İleri faz:

- `paused`
- `handoff`
- `cancelled`

## Urgency Model

Zaman bazlı görünürlük önemli olmalı:

- 0-3 dk: normal
- 3-7 dk: warning
- 7+ dk: urgent

Bu eşikler istasyon tipine göre ileride değişebilir.

Görsel karşılık:

- warning border
- urgent pulse chip
- elapsed timer tone shift

Board seviyesinde SLA şeridi bulunmalıdır:

- canlı ticket sayısı
- SLA riski
- servise hazır kalemler

Tek istasyon görünümü büyük ekran kullanımına uygun olmalı ve operatör için dikkat dağıtıcı
admin detaylarını göstermemelidir.

## Action Model

Kart üstünden erişilen temel aksiyonlar:

- `Hazirlamaya al`
- `Hazir yap`
- `Tekrar hazirla`
- `Iptal`

Kurallar:

- butonlar büyük olmalı
- renk ile durum ilişkisi net olmalı
- aksiyon sonrası kart kolon değiştirmeli

## Typography and Visual Rules

- arka plan koyu
- kartlar yarı mat açık yüzeyler
- sayaçlar büyük
- ticket notları yüksek kontrastta ama ikincil ağırlıkta

Önerilen tonlar:

- board bg: derin kömür / koyu yeşil-siyah
- card bg: sisli cam etkili koyu yüzey
- station accent: istasyon rengi
- ready: emerald
- urgent: hot amber / orange
- danger: brick red

## Station Identity

Her board istasyon kimliğini güçlü göstermeli:

- istasyon adı
- istasyon kodu
- istasyon rengi
- aktif ticket sayısı

Örnek:

- `BARISTA`
- `HOOKAH`
- `FASTFOOD`

## Small-Screen Rules

Mobil veya küçük tablette:

- istasyon sekmeleri yatay kaydırmalı
- kolonlar üst üste akabilir
- kart aksiyonları korunmalı
- tek seferde tek kolon odaklı görünüm tercih edilebilir

## What To Avoid

- küçük tablo satırları
- açık gri zeminler
- zayıf kontrast
- kartları fazla yazıyla boğmak
- gereksiz grafikler

## First Build Scope

1. single station board
2. elapsed time chip
3. urgency states
4. large action buttons
5. empty-state handling

## Recommendation

`Station Board`, TabFlow’un operasyonel farkını en güçlü hissettiren yüzeylerden biri olacak.
İyi tasarlanırsa sistem “QR menü + adisyon” olmaktan çıkıp gerçek üretim akışı yöneten bir platform gibi görünür.
