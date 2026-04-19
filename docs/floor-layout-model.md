# Floor Layout Model

## Goal

`Masa + Kasa` tek bir düz masa listesi değil, birden fazla fiziksel alanı aynı tenant altında
yöneten bir floor planning sistemi olmalıdır.

Bu model özellikle şu gerçek işletme ihtiyaçlarını kapsar:

- ana salon
- balkon / teras
- üst kat
- bahçe
- paket / kurye alanı
- VIP veya özel servis bölgesi

## Core Principle

Tenant içinde birden fazla `layout` bulunur.

Her `layout` kendi fiziksel düzenini taşır.

Önerilen hiyerarşi:

1. `layout`
2. `zone`
3. `table`

## Data Model

### Layout

Bir fiziksel alan ya da kat.

Örnek:

- `ana-kat`
- `balkon`
- `ust-kat`
- `paket`

Alanlar:

- `id`
- `code`
- `name`
- `sortOrder`
- `isActive`
- `canvasWidth`
- `canvasHeight`
- `backgroundStyle`

### Zone

Layout içindeki alt alan veya servis bölgesi.

Örnek:

- `Pencere Onu`
- `Kasiyer Yani`
- `Orta Alan`
- `Mutfak Servis Alani`

Alanlar:

- `id`
- `layoutId`
- `code`
- `name`
- `colorHex`
- `sortOrder`
- `x`
- `y`
- `w`
- `h`

### Table Placement

Masanın fiziksel yerleşim kaydı.

Alanlar:

- `tableId`
- `layoutId`
- `zoneId`
- `x`
- `y`
- `w`
- `h`
- `shape`
- `rotation`
- `zIndex`

## Screen Behavior

### Service Screen

Route:

- `/service`

Davranış:

- üstte layout sekmeleri görünür
- kullanıcı tek layout seçebilir
- opsiyonel `Hepsi` görünümü olabilir
- seçilen layout kendi masa planıyla açılır

### Edit Mode

`Masa + Kasa` içinde ayrı bir `Duzeni Duzenle` modu bulunmalıdır.

Kurallar:

- operasyon modu varsayılan
- edit mode açık olmadıkça masa sürüklenemez
- edit mode açıkken:
  - masalar sürüklenebilir
  - zone sınırları görünür
  - snap-to-grid aktif olabilir
  - değişiklikler kaydet / vazgeç ile yönetilir

## MVP Scope

1. bir tenant içinde birden fazla layout
2. layout sekmeleri
3. edit mode toggle
4. masa yerleşimini sürükle-bırak ile değiştirme
5. layout bazlı görünüm

## Later Scope

- resize
- rotation
- sabit obje ekleme
  - kasa bankosu
  - mutfak servis alanı
  - WC
  - giriş
  - duvar
- çoklu zone düzenleme
- layout çoğaltma
- kat bazlı personel görünürlüğü
