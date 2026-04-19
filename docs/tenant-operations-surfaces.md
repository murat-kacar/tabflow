# Tenant Operations Surfaces

## Scope

TabFlow tenant tarafında şimdilik kesinleşen operasyon yüzleri:

1. `Admin Console`
2. `Masa + Kasa`
3. `Station Board`
4. `Garson PDA Web`

`Customer/Tablet Menu` bu dokümanın dışında tutulmuştur ve ayrı tasarım yönüyle ele alınacaktır.

POS / yazarkasa / fiziksel ödeme entegrasyonu bu fazın dışında kalır.
Ödeme alma ve hesap kapatma akışı operasyonel olarak sistemde izlenir, tahsilat manuel alınır.

## Product Principle

Bu dört yüz aynı veri modeline bakmalı ama aynı görünmemelidir.

Her ekran kendi rolüne göre farklı davranmalıdır:

- `Admin Console`: denetim, görünürlük, karar ve müdahale
- `Masa + Kasa`: masa düzeni, adisyon, ödeme ve kapanış yönetimi
- `Station Board`: üretim akışı, gecikme görünürlüğü, minimum dikkat dağınıklığı
- `Garson PDA Web`: hız, tek el kullanımı, masa başı sipariş alma

Ama dördü de aynı ürün ailesine ait hissettirmelidir:

- aynı renk sistemi
- aynı tipografi ailesi
- aynı durum rozetleri
- aynı sipariş statü dili

## Official Route Model

Bu fazda legacy rota taşımıyoruz. Resmi ve tek geçerli tenant surface URL modeli:

- `/login`
- `/change-password`
- `/console`
- `/console/stations`
- `/service`
- `/stations`
- `/stations/[stationCode]`
- `/pda`

Yeni karar alındığında eski rota ağacını korumak yerine doğrudan kırıp daha temiz yapıya geçilir.

## Shared Design System

### Shared Status Language

Sipariş durumu her yüzeyde aynı kalmalı:

- `submitted`
- `preparing`
- `ready`
- `served`
- `cancelled`

Renkler:

- `submitted`: amber
- `preparing`: copper
- `ready`: emerald
- `served`: muted green-gray
- `cancelled`: brick / muted red
- `offline`: hard red

### Shared Data Anchors

Her yüzey şu kavramları ortak kullanmalı:

- masa numarası
- sipariş numarası
- ürün adı
- adet
- not
- istasyon
- açık hesap durumu
- cihaz / QR durumu
- zaman bilgisi

### Shared Interaction Rules

- en sık aksiyonlar ilk görünümde
- kritik aksiyonlar tek tık
- tehlikeli aksiyonlar onaylı
- canlı durum renk ve etiketle hemen anlaşılır
- her aksiyon sonrası görünür geri bildirim verilir

## Surface 1: Admin Console

### Role

İşletme yöneticisi ve yetkili personel için ana yönetim ve denetim merkezi.

### Main Jobs

- tüm işletmenin canlı durumunu görmek
- sorunlu masaları ve geciken akışları bulmak
- istasyonları, cihazları, personeli ve menüyü yönetmek
- operasyon kurulumunu yapmak

### Design Character

- sıcak ama profesyonel
- canlı operasyon duygusu yüksek
- yönetim ekranı gibi değil, servis kontrol odası gibi

### Core Screens

1. `Overview`
2. `Stations`
3. `Catalog`
4. `Devices`
5. `Staff`
6. `Settings`

### First-Screen Priority

Admin Console açıldığında ilk fold içinde görünmesi gerekenler:

- aktif masa sayısı
- açık hesap sayısı
- hazır sipariş sayısı
- offline cihaz sayısı
- dikkat gerektiren istasyonlar

### Core Components

- metric cards
- attention queue
- station health rail
- setup shortcuts
- exception list

## Surface 2: Masa + Kasa

### Role

Kasiyer, floor supervisor veya yetkili servis personeli için günlük operasyon çekirdeği.

### Main Jobs

- masa düzenini görmek
- açık adisyonları yönetmek
- sipariş ve hesap ilişkisini görmek
- ödeme işaretlemek
- hesap kapatmak
- masa taşıma / birleştirme
- kapanan hesap geçmişini takip etmek

### Design Character

- canlı ve taktiksel
- masa merkezli
- hızlı karar ve hızlı kapanış odaklı
- adisyon ekranı ile floor haritası arasında güçlü bağ kuran yapı

### Primary Navigation

1. `Floor`
2. `Open Checks`
3. `Payment Queue`
4. `Closed Checks`

Route:

- `/service`

### Core Components

- floor map
- table card
- open check drawer
- payment action bar
- merge / move modal
- close check confirmation

## Surface 3: Station Board

### Role

İstasyon operatörünün yalnızca kendi üretim hattını görüp yönettiği yüksek kontrastlı operasyon ekranı.

### Main Jobs

- kendi istasyonundaki yeni ticket’ları görmek
- hazırlanan ürünleri sıraya almak
- hazır olanları işaretlemek
- geciken ürünleri fark etmek
- sadece kendi istasyon alanında çalışmak

### Design Character

- koyu yüzey
- yüksek kontrast
- uzaktan okunabilir
- minimal ama sert operasyon dili

### Primary Structure

- tek istasyon görünümü veya supervisor için çoklu istasyon görünümü
- durum kolonları
  - `new`
  - `preparing`
  - `ready`
- ticket kartları

Routes:

- `/stations`
- `/stations/[stationCode]`

### Core Components

- station tab
- ticket card
- elapsed time chip
- urgent pulse badge
- big action button set

## Surface 4: Garson PDA Web

### Role

Garsonun mobil web-view üzerinden masada sipariş alıp yönetmesi için tasarlanmış operasyon yüzü.

Bu ekran native uygulama gibi davranmalı ama web tabanlı olmalı.

Route:

- `/pda`

### Main Jobs

- şifreli kullanıcı girişi
- masa seçimi
- masa siparişi oluşturma
- ürün ekleme / çıkarma
- ürün notu ekleme
- siparişi ilgili istasyonlara gönderme
- masa hesabını görme
- yetkiye bağlı olarak hesabı kapatma veya kapatma talebi gönderme

### Design Character

- tek elle kullanılabilir
- hızlı, büyük dokunma alanlı
- yoğun ama anlaşılır
- garsonun acele halinde hata yapmasını önleyecek kadar yönlendirmeli

### Primary Navigation

1. `Login`
2. `Table Picker`
3. `Order Composer`
4. `Open Bill / Table Summary`
5. `Service Actions`

### Core Components

- staff login panel
- table status pill
- category tabs
- product tile
- cart rail / sticky basket
- order send bar
- bill footer

## Cross-Surface Mapping

### Admin Console -> Masa + Kasa

Admin Console işletmeye yukarıdan bakar.
Masa + Kasa günlük floor ve tahsilat operasyonunu yürütür.

### Admin Console -> Station Board

Admin Console gecikmeyi ve istasyon yükünü görür.
Station Board üretim adımını yürütür.

### Garson PDA Web -> Station Board

Garson siparişi yollar.
Station Board ticket üretir.

## Suggested Build Order

1. `Admin Console`
2. `Masa + Kasa`
3. `Station Board`
4. `Garson PDA Web`

Neden:

- operasyonel çekirdek önce overview ve floor/cash tarafında oturmalı
- station board daha sonra bunun üretim ayağını tamamlamalı
- PDA en son, oturmuş operasyon modelini mobilde uygular

## MVP Feature Mapping

POS entegrasyonu hariç hedeflenen özellikler:

- masa bazlı operasyon
- mobil sipariş alma
- şifreli personel girişi
- istasyon bazlı üretim akışı
- hesap görünürlüğü
- yetkiye bağlı hesap kapatma
- cihaz/QR ilişkisi
- ürün notları
- servis/operasyon görünürlüğü

## Recommendation

Şimdiki tasarım çalışmaları şu sırada ilerlemeli:

1. `Admin Console shell + Overview`
2. `Masa + Kasa workspace`
3. `Station Board redesign`
4. `Garson PDA Web IA + mobile interaction model`

Bu dördü oturduktan sonra TabFlow tenant tarafı ürün olarak netleşmiş olur.
