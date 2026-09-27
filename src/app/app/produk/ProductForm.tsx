"use client";

import { useRef, useState, useTransition } from "react";
import { deleteProduct, saveProduct } from "@/lib/preorderActions";
import { uploadPhoto } from "@/lib/upload";
import { hppPct, hppStatus, DEFAULT_TARGET_HPP_PCT } from "@/lib/costing";
import { formatNumber, formatRupiah, parseNumberInput } from "@/lib/format";
import type { Product } from "@/lib/preorder";
import { WEB_CATEGORIES, WEB_CATEGORY_LABEL, type WebCategory } from "@/content/site";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";
import { ErrorBox, HppBadge, Row } from "@/components/ui";
import { ProductThumb } from "@/components/preorder";

export interface SourceOption {
  ref: string; // "r:<id>" | "b:<id>"
  name: string;
  unit: string;
  group: string;
}

export function ProductForm({
  initial,
  photoUrl,
  sources,
  costs,
  canEdit,
}: {
  initial: (Product & { webCategory: WebCategory }) | null;
  photoUrl: string | null;
  sources: SourceOption[];
  costs: Record<string, number | null>;
  canEdit: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [ref, setRef] = useState(initial ? (initial.recipeId ? `r:${initial.recipeId}` : `b:${initial.bundleId}`) : "");
  const [units, setUnits] = useState(formatNumber(initial?.unitsPerProduct ?? 1, 3));
  const [price, setPrice] = useState(initial ? formatNumber(initial.price) : "");
  const [capacity, setCapacity] = useState(initial?.weeklyCapacity != null ? String(initial.weeklyCapacity) : "");
  const [lead, setLead] = useState(String(initial?.minLeadDays ?? 2));
  const [preorder, setPreorder] = useState(initial?.preorderEnabled ?? true);
  const [website, setWebsite] = useState(initial?.showOnWebsite ?? false);
  const [active, setActive] = useState(initial?.isActive ?? true);
  const [webCategory, setWebCategory] = useState<WebCategory>(initial?.webCategory ?? "kue_basah");
  const [photoPath, setPhotoPath] = useState(initial?.photoPath ?? null);
  const [preview, setPreview] = useState(photoUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const source = sources.find((s) => s.ref === ref);
  const unitsN = parseNumberInput(units) ?? 0;
  const priceN = parseNumberInput(price);
  const unitCost = costs[ref] ?? null;
  const cost = unitCost == null ? null : unitCost * unitsN;
  const hpp = cost == null ? null : hppPct(cost, priceN);

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const path = await uploadPhoto("product-photos", "produk", file);
      setPhotoPath(path);
      setPreview(URL.createObjectURL(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  };

  const submit = () => {
    setError(null);
    const [kind, id] = ref.split(":");
    start(async () => {
      const res = await saveProduct({
        id: initial?.id ?? null,
        name,
        description,
        source: { kind: kind === "b" ? "bundle" : "recipe", id: id ?? "" },
        unitsPerProduct: unitsN,
        price: priceN ?? -1,
        weeklyCapacity: capacity.trim() ? parseNumberInput(capacity) : null,
        minLeadDays: parseNumberInput(lead) ?? -1,
        preorderEnabled: preorder,
        showOnWebsite: website,
        isActive: active,
        photoPath,
        webCategory,
      });
      if (res?.error) setError(res.error);
    });
  };

  const groups = [...new Set(sources.map((s) => s.group))];
  const toggle = (label: string, value: boolean, set: (v: boolean) => void) => (
    <label className="flex min-h-12 items-center gap-3">
      <input type="checkbox" checked={value} onChange={(e) => set(e.target.checked)} className="size-6 accent-cocoa" />
      <span className="font-semibold">{label}</span>
    </label>
  );

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <fieldset disabled={!canEdit} className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <ProductThumb url={preview} name={name} size={88} />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary">
              {uploading ? "Mengupload…" : preview ? "📷 Ganti foto" : "📷 Tambah foto"}
            </button>
            {preview && <button type="button" onClick={() => { setPhotoPath(null); setPreview(null); }} className="text-sm text-bad underline">Hapus foto</button>}
          </div>
        </div>
        <label><span className="field-label">Nama produk</span><input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="mis. Risol Ragout Frozen isi 10" /></label>
        <label><span className="field-label">Deskripsi (untuk website)</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input py-2" /></label>
        <label>
          <span className="field-label">Dibuat dari (resep / paket)</span>
          <select value={ref} onChange={(e) => setRef(e.target.value)} className="input">
            <option value="">— Pilih —</option>
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {sources.filter((s) => s.group === g).map((s) => <option key={s.ref} value={s.ref}>{s.name}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="field-label">Isi per produk ({source?.unit ?? "satuan"})</span>
            <input value={units} onChange={(e) => setUnits(e.target.value)} inputMode="decimal" className="input" />
          </label>
          <label><span className="field-label">Harga jual (Rp)</span><input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" className="input" placeholder="75.000" /></label>
        </div>
        <div className="card flex items-center justify-between bg-crust/60 p-3">
          <div className="flex-1">
            <Row label="Biaya (HPP)" value={formatRupiah(cost)} />
            <Row label="Margin" value={cost == null || priceN == null ? "–" : formatRupiah(priceN - cost)} />
          </div>
          <span className="ml-3"><HppBadge hpp={hpp} status={hppStatus(hpp, DEFAULT_TARGET_HPP_PCT)} /></span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label><span className="field-label">Kapasitas / minggu</span><input value={capacity} onChange={(e) => setCapacity(e.target.value)} inputMode="numeric" className="input" placeholder="kosong = tanpa batas" /></label>
          <label><span className="field-label">Lead time (hari)</span><input value={lead} onChange={(e) => setLead(e.target.value)} inputMode="numeric" className="input" /></label>
        </div>
        <label>
          <span className="field-label">Kategori di website</span>
          <select value={webCategory} onChange={(e) => setWebCategory(e.target.value as WebCategory)} className="input">
            {WEB_CATEGORIES.map((c) => <option key={c} value={c}>{WEB_CATEGORY_LABEL[c]}</option>)}
          </select>
        </label>
        {toggle("Bisa dipreorder", preorder, setPreorder)}
        {toggle("Tampil di website", website, setWebsite)}
        {toggle("Aktif", active, setActive)}
      </fieldset>
      <ErrorBox message={error} />
      {canEdit && <button type="submit" disabled={pending || uploading} className="btn-primary w-full">{pending ? "Menyimpan…" : "Simpan produk"}</button>}
      {canEdit && initial && (
        <ConfirmActionButton
          action={deleteProduct.bind(null, initial.id)}
          confirmText={`Hapus produk "${initial.name}"? (Tidak bisa kalau sudah ada order.)`}
          label="Hapus produk"
          pendingLabel="Menghapus…"
          className="btn-danger w-full"
        />
      )}
    </form>
  );
}
