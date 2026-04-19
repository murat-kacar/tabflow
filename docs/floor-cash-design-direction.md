# Masa + Kasa Design Direction

## Goal

`Masa + Kasa` yüzeyi TabFlow’un günlük operasyon kalbidir.

Bu ekranın temel işi:

1. masaların canlı durumunu görmek
2. açık adisyonları yönetmek
3. manuel tahsilat ve hesap kapatma akışını hızlandırmak

Bu ekran ne tam anlamıyla kasadır, ne sadece masa planıdır.
İkisini aynı çalışma yüzeyinde birleştiren hibrit bir operasyon konsolu olmalıdır.

## Product Character

Hedef his:

- canlı
- masa merkezli
- hızlı
- streste kullanılabilir
- adisyon akışı ile floor durumunu aynı bağlamda tutan yapı

Bu ekran açıldığında kullanıcı şunu hissetmeli:

- hangi masalar dolu
- hangi masalarda aktif sipariş var
- hangi masalarda açık hesap var
- hangi hesaplar kapanmaya hazır

## Primary Mental Model

`Masa + Kasa` şu iki şeyi aynı anda göstermelidir:

- mekân üzerindeki fiziksel akış
- para/adisyon üzerindeki operasyonel akış

Bu yüzden ekran iki ana mantık arasında çalışır:

- `Floor View`
- `Cash View`

## Information Architecture

Route:

- `/service`

Layout model:

- bir tenant içinde birden fazla fiziksel layout bulunmalıdır
- örnek:
  - `Ana Kat`
  - `Balkon`
  - `Ust Kat`
  - `Paket`
- her layout kendi masa planını taşır
- `Masa + Kasa` operasyon modu seçili layout üstünden çalışır

### Core Tabs

1. `Floor`
2. `Open Checks`
3. `Payment Queue`
4. `Closed Checks`

### Floor View

Odak:

- masa düzeni
- layout seçimi
- masa doluluğu
- aktif sipariş
- açık hesap
- cihaz / QR durumu
- müdahale önceliği
- servis baskısı

### Open Checks

Odak:

- açık adisyonlar
- toplam tutar
- sipariş yoğunluğu
- hesap yaşı

### Payment Queue

Odak:

- kapanmaya hazır hesaplar
- tahsil edildi işaretleme
- ödeme tipi notu
- kapanış onayı
- kasiyer öncelik sırası

### Closed Checks

Odak:

- kapanan son hesaplar
- operatör bilgisi
- kapanış zamanı
- geçmiş işlem denetimi

## Layout Model

### Desktop

```text
+------------------------------------------------------------------+
| Masa + Kasa | Floor / Open Checks / Payment Queue / Closed       |
+---------------------------------------------+--------------------+
| Floor map / table grid                      | Selected table     |
| [M01] [M02] [M03] [M04]                     | open bill          |
| [M05] [M06] [M07] [M08]                     | live orders        |
| [M09] [M10] [M11] [M12]                     | payment actions    |
|                                             | move / merge       |
+---------------------------------------------+--------------------+
| Open checks rail / payment strip                                 |
+------------------------------------------------------------------+
```

### Tablet

- grid korunur
- sağ detay paneli bottom sheet’e döner
- payment queue yatay sekme olur

### Mobile

- masa kart listesi
- seçili masa bottom drawer
- alt sabit aksiyon çubuğu

## Table Card Design

Her masa kartında görünmesi gerekenler:

- masa numarası
- aktif/pasif durum
- açık hesap var mı
- sipariş yoğunluğu
- hazır ürün var mı
- cihaz online mı

Önerilen görsel düzen:

- üstte masa numarası
- ortada canlı durum rozetleri
- altta tutar veya sipariş sayısı

### Table Card States

- `empty`
- `occupied`
- `active-order`
- `ready-to-serve`
- `open-check`
- `offline-device`
- `attention`

## Open Check Drawer

Bir masa seçildiğinde açılacak sağ panel / drawer şunları içermeli:

- masa özeti
- açık hesap toplamı
- bağlı siparişler
- sipariş zamanları
- ürün listesi
- notlar
- ödeme aksiyonları

### Primary Actions

- `Odeme alindi olarak isaretle`
- `Hesabi kapat`
- `Masayi tasi`
- `Masalari birlestir`
- `Hesabi ayir`
- `Siparis detayi gor`

Bu aksiyonlar sadece görsel CTA olmamalıdır. MVP davranışı:

- masa taşıma, açık hesabı boş hedef masaya taşır
- masa birleştirme, kaynak açık hesabın siparişlerini hedef açık hesaba aktarır
- hesap ayırma, seçili siparişleri hedef masanın açık hesabına taşır veya hedefte hesap yoksa oluşturur
- hesap kapatma, manuel tahsilat sonrası hesabı kapatır

## Payment Model

POS entegrasyonu olmadığı için ödeme modeli operasyonel takip odaklı olmalıdır.

MVP:

- ödeme yöntemi not olarak kaydedilebilir
- ödeme alındı işaretlenir
- hesap kapanır

Ödeme yöntemi önerileri:

- `nakit`
- `kart`
- `transfer`
- `diger`

Bu bilgi muhasebe entegrasyonu değil, operasyon kaydı olarak tutulur.

## Color Rules

- boş masa: sıcak nötr
- aktif masa: amber
- hazır sipariş olan masa: emerald highlight
- açık hesap: koyu taş / kömür etiketi
- offline cihaz: brick red
- kapanmaya hazır hesap: deep green accent

## Interaction Rules

- masa seçimi tek tık
- layout sekmesi tek tık
- ödeme aksiyonları görünür ve net
- masa taşıma / birleştirme kontrollü modal ile yapılmalı
- kapanış aksiyonu ikinci onay istemeli
- hesap kapandığında kart durumu anında güncellenmeli
- acil masalar floor grid'in üst sıralarına yükselmelidir
- servis bekleyen ve offline cihazlı masalar ayrı bir aksiyon şeridinde görünmelidir
- edit mode açık olmadıkça floor plan sürüklenebilir olmamalıdır

## Edit Mode

`Masa + Kasa` içinde ayrı bir `Duzeni Duzenle` modu olmalıdır.

Bu mod:

- operasyonu bozmadan açılır
- mevcut layout üzerinde drag-drop çalıştırır
- masaların yeni yerini geçici state içinde tutar
- kaydet / vazgeç ile sonlanır

## What To Avoid

- klasik desktop POS tablo görünümü
- aynı anda çok fazla küçük sayı göstermek
- ödeme akışını form ekranına gömmek
- masa planını sadece dekoratif bırakmak

## First Build Scope

1. floor map
2. table card states
3. selected table drawer
4. open checks strip
5. payment queue panel

## Recommendation

Bu yüzey, tenant tarafında ilk “wow” etkisi yaratacak ekranlardan biri olabilir.
Çünkü kullanıcı burada sistemi gerçekten işletmeye dokunur halde görür.
