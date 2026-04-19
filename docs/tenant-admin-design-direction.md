# Tenant Admin Design Direction

## Goal

TabFlow admin tarafı generic bir SaaS panel gibi değil, restoran operasyonunu yöneten premium bir kontrol merkezi gibi hissettirmelidir.

Bu yüzeyin ana işi:

1. işletmenin canlı durumunu görmek
2. istasyon ve cihaz sağlığını görmek
3. operasyon kurulumunu ve yönetimini yapmak

`Masa + Kasa` ve `Station Board` ayrı yüzeylerdir.
Bu doküman yalnızca admin-side yönetim dili içindir.

## Product Direction

Hedef his:

- geleneksel restoran otomasyonlarından daha modern
- genel admin panellerden daha operasyon odaklı
- sıcak ama kurumsal
- canlı veri görünürlüğü yüksek

## Visual Language

### Core Mood

- sıcak taş / kağıt / doğal tonlar
- beyaz yüzeyler
- güçlü istasyon renk vurguları
- büyük ve güven veren başlıklar

### Color System

- `--bg-canvas: #f5f1e8`
- `--bg-panel: #fffdf9`
- `--bg-panel-muted: #f0ebe1`
- `--ink-strong: #1d1c19`
- `--ink-soft: #5f5a50`
- `--accent-forest: #1e4a3a`
- `--accent-amber: #ba7a22`
- `--accent-ready: #157347`
- `--accent-danger: #a33a2b`
- `--line-soft: #d9d1c3`

### Typography

- başlıklar: karakter sahibi ama abartısız
- UI metinleri: yoğun kullanıma uygun sans
- sayaçlar: net ve güçlü

Öneri:

- Heading: `Fraunces` veya `Bricolage Grotesque`
- UI: `Manrope` veya `IBM Plex Sans`

## Navigation Model

Recommended admin-side navigation:

1. `Overview`
2. `Stations`
3. `Catalog`
4. `Devices`
5. `Staff`
6. `Settings`

Route model:

- `/console`
- `/console/stations`

## Recommended Screen Architecture

### Overview

Purpose:

- canlı yönetim özeti
- ilk ekran

Sections:

- üst özet bandı
  - aktif masa
  - açık hesap
  - hazır sipariş
  - offline cihaz
- dikkat kuyruğu
  - sorunlu istasyonlar
  - fallback istasyondaki ürünler
  - offline cihazlar
- istasyon sağlık paneli
- hızlı kurulum aksiyonları

### Stations

Purpose:

- station-first operasyon modelini yönetmek

Sections:

- filtreler
  - all
  - active
  - fallback
  - warning
- station cards
  - ad
  - kod
  - renk
  - operator sayısı
  - ürün sayısı
  - yük özeti
- sağ detay paneli
  - düzenle
  - pasife al
  - fallback yap
  - ürün bağla

### Catalog

Purpose:

- menü ve ürünleri istasyon mantığıyla yönetmek

Sections:

- kategori listesi
- ürün listesi
- ürün editörü
- istasyon rozetleri

### Devices

Purpose:

- QR/device operasyon güveni

Sections:

- online/offline özeti
- masa-cihaz eşleşmeleri
- son check-in kayıtları
- anahtar yenileme aksiyonları

### Staff

Purpose:

- personel ve rol görünürlüğü

Sections:

- kullanıcı listesi
- rol etiketleri
- bağlı istasyonlar
- aktif/pasif durumu

### Settings

Purpose:

- işletme ayarları ve düşük frekanslı kurulumlar

Sections:

- işletme kimliği
- para birimi / locale
- admin güvenliği
- domain ve QR ayarları

## Page Skeletons

### Desktop Shell

```text
+---------------------------------------------------------------+
| Logo | Overview | Stations | Catalog | Devices | Staff | More |
| Tenant name                          Search     Alerts  Admin  |
+----------------------+----------------------------------------+
| Left rail            | Top summary band                       |
| - overview           | 4 priority metrics                     |
| - stations           +-------------------+--------------------+
| - catalog            | Attention queue   | Quick actions      |
| - devices            +-------------------+--------------------+
| - staff              | Station health / setup pulse           |
| - settings           +----------------------------------------+
|                      | Exceptions / device alerts / notes     |
+----------------------+----------------------------------------+
```

### Stations Workspace

```text
+---------------------------------------------------------------+
| Stations | All / Active / Fallback / Warning                  |
+------------------------------+-------------------------------+
| Station cards                | Selected station detail       |
| Barista                      | products count                |
| Bar                          | operators                     |
| Hookah                       | load summary                  |
| Fastfood                     | edit / disable / reorder      |
+------------------------------+-------------------------------+
```

### Mobile Overview

```text
+--------------------------------------+
| Tenant name            Alerts  Admin |
| Overview                            |
+--------------------------------------+
| Metric carousel                      |
+--------------------------------------+
| Attention cards                      |
+--------------------------------------+
| Station health cards                 |
| Device warning cards                 |
+--------------------------------------+
| Bottom nav: Overview Stations More   |
+--------------------------------------+
```

## Component Priorities

1. app shell
2. metric cards
3. status chips
4. station cards
5. attention queue cards
6. side detail drawer
7. fallback warning card
8. setup wizard stepper
9. form drawers for catalog and settings

## What To Avoid

- legacy POS yoğunluğu
- bütün operasyonu tek admin ekranına yığmak
- first fold altına düşen kritik bilgiler
- mor SaaS görünümü

## First Implementation Plan

Phase 1:

- redesign shell/navigation
- redesign overview
- redesign stations workspace

Phase 2:

- redesign `Masa + Kasa` workspace
- redesign `Station Board`

Phase 3:

- redesign catalog, devices, staff, settings
- redesign `Garson PDA Web`
- unify login and first-password-change visual language

## Recommendation

Start with `Overview`, `Masa + Kasa`, and `Station Board`.
If these three screens feel sharp, operational, and premium, the rest of the system can inherit the language naturally.
