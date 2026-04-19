# Station-First Operations Model

## Goal

TabFlow tenant operasyon modeli `kitchen-first` değil, `station-first` olmalıdır.

Bu şu anlama gelir:

- ürünler bir üretim/servis istasyonuna bağlıdır
- siparişler istasyon bazında parçalanır
- farklı roller yalnızca kendi istasyonlarını görür
- admin ise tüm istasyonları merkezi olarak yönetir

Bu model, klasik restoran otomasyonlarındaki:

- mutfak
- bar
- barista
- nargile
- fastfood
- tatlı
- paketleme

gibi farklı üretim akışlarını tek veri modelinde birleştirir.

## Core Principle

TabFlow should treat a station as the fundamental fulfillment unit.

Örnek:

- `Cheeseburger` -> `fastfood`
- `Latte` -> `barista`
- `Mojito` -> `bar`
- `Nargile özel karışım` -> `hookah`
- `San Sebastian` -> `dessert`

Aynı sipariş birden fazla istasyona bölünebilir.
Ancak MVP seviyesinde her `menu item` tek bir birincil istasyona bağlı olacaktır.

## Why This Model

Bu model neden daha doğru:

- her işletmenin servis yapısı farklıdır
- sabit `bar / kitchen / dessert` listesi yetersiz kalır
- ticket akışı ancak doğru role düşerse hızlanır
- aynı tenant içinde farklı operasyon kurguları kurulabilir

Bu, TabFlow’u sadece QR menü sisteminden çıkarıp operasyon altyapısına dönüştürür.

## Station Definition

Bir istasyon şu alanlara sahip olmalıdır:

- `id`
- `code`
- `name`
- `colorHex`
- `sortOrder`
- `isActive`
- `stationKind`
- `visibilityMode`
- `isFallback`
- `description`

### Recommended Station Kinds

MVP için:

- `production`
- `service`
- `dispatch`
- `prep`

Örnek kullanımlar:

- `barista` -> `production`
- `bar` -> `production`
- `hookah` -> `production`
- `fastfood` -> `production`
- `dispatch` -> `dispatch`

`stationKind` görsel düzen, filtreleme ve ileride SLA kuralları için kullanılabilir.

## Suggested Default Stations

Yeni tenant açıldığında sistem tamamen boş gelmemeli.

Başlangıç seti:

1. `general`
2. `bar`
3. `kitchen`
4. `dessert`

Ancak bunlar sadece başlangıç setidir.
Admin daha sonra:

- yeni istasyon ekleyebilir
- pasife alabilir
- yeniden sıralayabilir
- kendi işletmesine göre yeniden şekillendirebilir

`general` fallback istasyonu her zaman sistemde bulunmalıdır.

## Fallback Rule

Yeni ürün eklenirken istasyon ataması unutulursa:

- ürün görünmez hale gelmemeli
- order routing bozulmamalı

Bu yüzden bir `fallback station` zorunlu olmalıdır.

Kural:

- her tenantta tam olarak bir aktif fallback istasyon bulunur
- atanamayan ürünler bu istasyona düşer
- admin panel bu durumu uyarı olarak gösterir

Örnek uyarı:

- `3 ürün fallback istasyonunda. Uygun üretim istasyonuna bağlamanız önerilir.`

## Product-to-Station Assignment

MVP:

- her `menu item` tek bir birincil istasyona bağlıdır

Bu bağ ürün oluştururken veya düzenlerken seçilir.

İleri faz:

- ürün bazlı gelişmiş kurallar
- varyanta göre istasyon
- saat aralığına göre istasyon
- teslimat türüne göre istasyon

Ancak MVP’de gereksiz karmaşıklık yaratmamak için tek istasyon seçimi yeterlidir.

## Role-to-Station Visibility

Kullanıcı sadece yetkili olduğu istasyonları görmelidir.

Örnek roller:

- `admin`
- `cashier`
- `waiter`
- `supervisor`
- `station_operator`

İstasyon odaklı alt roller:

- `kitchen`
- `barista`
- `bartender`
- `hookah`
- `dispatcher`

MVP önerisi:

- kullanıcı hesapları bir veya daha fazla istasyona bağlanabilir
- `admin` ve `supervisor` tüm istasyonları görebilir
- `station_operator` sadece bağlı olduğu istasyonları görür

## Surface Mapping

### Admin Console

Admin Console tüm istasyonları görebilir:

- istasyon listesi
- istasyon yükü
- hazır ticket sayısı
- geciken ticket sayısı
- istasyon bazlı performans özeti
- kurulum ve yetki yönetimi

### Masa + Kasa

Masa + Kasa yüzeyi floor ve tahsilat operasyonunu yönetir:

- masa durumu
- açık adisyon
- ödeme kuyruğu
- manuel ödeme işaretleme
- hesap kapatma
- masa taşıma / birleştirme

### Garson PDA Web

Garson istasyon görmeyebilir ama sistem siparişi istasyona doğru yönlendirir.

Opsiyonel olarak:

- ürün detayında üretim etiketi gösterilebilir
- `bar ürünü`, `mutfak ürünü`, `nargile` gibi hafif işaretler olabilir

### Station Board

Bu yüzey artık resmi olarak `Station Board` ailesine aittir.

Her station operator kendi ekranını görür:

- `barista board`
- `bar board`
- `hookah board`
- `fastfood board`

`Kitchen Board` sadece bir station board varyantıdır; ürün dili ana kavram olarak `Station Board` kullanmalıdır.

## Station Setup Wizard

Admin için istasyon kurulum sihirbazı olmalıdır.

### Wizard Steps

1. `Temel Bilgi`
   - istasyon adı
   - kısa kod
   - açıklama

2. `Görsel Tanım`
   - renk
   - sıra
   - aktif/pasif

3. `İstasyon Türü`
   - production
   - service
   - dispatch
   - prep

4. `Görünürlük`
   - kimler görebilir
   - sadece atanmış personel mi
   - supervisor görebilir mi

5. `Ürün Eşleme`
   - mevcut ürünlerden seçim
   - kategori bazlı öneri

6. `Fallback ve Doğrulama`
   - fallback istasyon mu
   - çakışma kontrolü
   - özet ekranı

### Wizard Outcomes

Kurulum sonunda:

- istasyon oluşur
- seçilen ürünler bu istasyona bağlanır
- ilgili board’da görünmeye hazır hale gelir

## Product Creation Wizard

Ürün ekleme sihirbazı mutlaka istasyon seçimini içermelidir.

### Wizard Steps

1. `Kategori`
2. `Ürün Bilgileri`
3. `Fiyatlandırma`
4. `Açıklama / Görsel`
5. `İstasyon Ataması`
6. `Satış Durumu`
7. `Önizleme`

### Station Assignment Rules

- istasyon seçimi zorunlu görünmelidir
- seçim yapılmazsa fallback açıkça gösterilmelidir
- admin, ürünün hangi board’a düşeceğini önceden görmelidir

Örnek metin:

- `Bu ürün Barista istasyonuna düşecek.`
- `İstasyon seçilmedi. Genel Hazırlık istasyonuna yönlenecek.`

## Station Manager Screen

Admin Console içinde ayrı bir `Stations` ya da `Production Setup` alanı olmalıdır.

Bu ekranda:

- istasyon kartları
- sıra değiştirme
- aktif/pasif alma
- fallback işaretleme
- bağlı ürün sayısı
- görünür roller

görünmelidir.

### Station Card Contents

- ad
- kod
- renk
- tür
- aktiflik
- bağlı ürün sayısı
- operator sayısı
- fallback durumu

## Catalog Changes Required

Mevcut katalog mantığı station-first yapıyla daha sıkı bağlanmalıdır.

Katalog tarafında istenen değişiklikler:

- kategori bazlı istasyon ataması artık yardımcı kural olmalı
- ürün bazlı istasyon ataması asıl kaynak olmalı
- ürün listesinde istasyon rozetleri görünmeli
- filtreleme istasyona göre yapılabilmeli

Önerilen kural:

- category station assignment = optional default
- item station assignment = final explicit routing source

Bu sayede aynı kategorideki ürünler farklı istasyonlara gidebilir.

## Data Model Direction

MVP düzeyinde önerilen veri modeli:

- `service_stations`
- `menu_items.station_id`
- `staff_accounts`
- `staff_station_assignments`

İleri faz:

- `menu_item_station_rules`
- `station_role_assignments`
- `station_sla_rules`
- `station_shift_assignments`

## Operational Flow

Sipariş geldiğinde:

1. müşteri veya garson siparişi oluşturur
2. sistem item bazında istasyon belirler
3. her istasyon kendi ticket parçalarını görür
4. durum ilerledikçe ilgili board güncellenir
5. admin tüm akışı birleşik olarak izler

## MVP

MVP’de mutlaka olmalı:

- admin station CRUD
- fallback station
- ürün bazlı station assignment
- station board grouping
- role/station visibility basics
- station setup wizard
- product wizard station step

## Later Phases

Sonraki fazlarda eklenebilir:

- station bazlı SLA
- station bazlı ses uyarıları
- vardiya/personel eşleme
- station bazlı performans raporu
- tek ürün için çok adımlı üretim zinciri
- teslimat/paketleme istasyonu

## Conflicts With Current Baseline

Mevcut kaynak tabanında şu noktalar bu modelle tam uyumlu değil:

1. default station seed sabit ve çok sınırlı
   - bugün `bar`, `kitchen`, `dessert` seed ediliyor
   - bu, station-first yaklaşım için dar bir başlangıç

2. category -> station ilişkisi çok baskın
   - dokümanlarda kategoriye istasyon atanması öne çıkıyor
   - oysa hedefte ürün bazlı istasyon ataması ana kaynak olmalı

3. `Kitchen Board` ismi dar kalıyor
   - gerçek model artık mutfaktan geniş
   - ürün mimarisi station board mantığına kaymalı

4. personel/rol -> istasyon görünürlüğü henüz tanımlı değil
   - bu yeni mimaride kritik bir ihtiyaç

Bu çelişkiler çözülemez türden değil; aksine iyi bir evrim noktasıdır.

## Recommendation

Bir sonraki tasarım ve mimari fazı şu sırayla ilerlemeli:

1. `Admin Console + Overview` resmi yönetim yüzü olarak konumlanmalı
2. `Masa + Kasa` floor/tahsilat yüzü olarak ayrıştırılmalı
3. station manager ve wizard akışları tasarlanmalı
4. `Station Board` konsepti tüm üretim yüzleri için temel alınmalı
5. sonra `Garson PDA Web` bu modele göre işlenmeli
