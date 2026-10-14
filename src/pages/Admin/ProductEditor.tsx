import { useState } from 'react';
import type { Product } from '../../types';
import { formatKSh } from '../../utils/currency';
import ColorPhotos from './ColorPhotos';
import { compressImage, fitsInDoc } from '../../utils/compressImage';
import { getProductOverrides, setProductOverride, clearProductOverride } from '../../utils/productOverrides';

const CATEGORIES: Product['category'][] = ['watches', 'dresses', 'pants', 'blouses', 'tshirts', 'sweaters'];
const categoryLabel: Record<string, string> = { blouses: 'Shirts' };
const toList = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean);
const MAX_IMAGES = 4; // images are stored inside the Firestore document, which caps at 1 MB

function ProductRow({ product, overridden, onSaved }: { product: Product; overridden: boolean; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(String(product.price));
  const [original, setOriginal] = useState(product.originalPrice ? String(product.originalPrice) : '');
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [category, setCategory] = useState(product.category);
  const [sizes, setSizes] = useState(product.sizes.join(', '));
  const [colors, setColors] = useState(product.colors.join(', '));
  const [stock, setStock] = useState(product.stock != null ? String(product.stock) : '');
  const [files, setFiles] = useState<File[]>([]);
  const [colorFiles, setColorFiles] = useState<Record<string, File[]>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const p = Number(price);
    const o = original.trim() === '' ? null : Number(original);
    const st = stock.trim() === '' ? null : Number(stock);
    if (!Number.isFinite(p) || p <= 0 || (o !== null && (!Number.isFinite(o) || o <= 0))) return setError('Enter a valid price');
    if (st !== null && (!Number.isInteger(st) || st < 0)) return setError('Stock must be a whole number');
    if (!name.trim()) return setError('Name is required');
    if (toList(sizes).length === 0 || toList(colors).length === 0) return setError('Add at least one size and one colour');
    setError('');
    setSaving(true);
    try {
      const prev = getProductOverrides()[product.id];
      const images = files.length > 0 ? await Promise.all(files.map(compressImage)) : prev?.images;
      const colorImages: Record<string, string[]> = {};
      for (const color of toList(colors)) {
        const picked = colorFiles[color];
        const photos = picked?.length ? await Promise.all(picked.map(compressImage)) : (prev?.colorImages ?? product.colorImages)?.[color];
        if (photos?.length) colorImages[color] = photos;
      }
      if (!fitsInDoc([...(images ?? []), ...Object.values(colorImages).flat()])) return setError('Too many / too large photos for one product');
      await setProductOverride(product.id, {
        price: p, originalPrice: o, name: name.trim(), description: description.trim(), stock: st,
        category, sizes: toList(sizes), colors: toList(colors),
        ...(images && { images }),
        ...(Object.keys(colorImages).length > 0 && { colorImages }),
      });
      onSaved();
    } catch {
      setError('Could not process the images');
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    await clearProductOverride(product.id);
    onSaved();
  };

  return (
    <div className="price-row">
      <img src={product.images[0]} alt="" className="price-row__img" />
      <div className="price-row__name">
        <span>{product.name}</span>
        <small>{product.category} &middot; now {formatKSh(product.price)}{overridden ? ' (edited)' : ''}</small>
      </div>
      <label className="price-row__field">Price
        <input className="admin__input" type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} />
      </label>
      <label className="price-row__field">Was
        <input className="admin__input" type="number" min="1" placeholder="none" value={original} onChange={(e) => setOriginal(e.target.value)} />
      </label>
      <div className="price-row__actions">
        <button className="admin__export-btn" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        <button className="admin__cancel-btn" onClick={() => setOpen(!open)}>{open ? 'Less' : 'More'}</button>
        {overridden && <button className="admin__cancel-btn" onClick={reset}>Reset</button>}
      </div>
      {open && (
        <div className="price-row__more">
          <label className="price-row__field">Name
            <input className="admin__input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="price-row__field">Category
            <select className="admin__input admin__select" value={category} onChange={(e) => setCategory(e.target.value as Product['category'])}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel[c] ?? c}</option>)}
            </select>
          </label>
          <label className="price-row__field">Sizes (comma separated)
            <input className="admin__input" value={sizes} onChange={(e) => setSizes(e.target.value)} />
          </label>
          <label className="price-row__field">Colours (comma separated)
            <input className="admin__input" value={colors} onChange={(e) => setColors(e.target.value)} />
          </label>
          <label className="price-row__field">Stock (empty = not tracked)
            <input className="admin__input" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
          </label>
          <label className="price-row__field price-row__field--wide">Description
            <textarea className="admin__input admin__textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="price-row__field price-row__field--wide">Replace images (up to {MAX_IMAGES}; leave empty to keep current)
            <input
              className="admin__input admin__file"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, MAX_IMAGES))}
            />
          </label>
          <div className="price-row__field--wide">
            <ColorPhotos
              colors={toList(colors)}
              existing={product.colorImages}
              files={colorFiles}
              onPick={(color, picked) => setColorFiles((prev) => ({ ...prev, [color]: picked }))}
            />
          </div>
          {files.length > 0 && <span className="price-row__field">{files.length} new image{files.length > 1 ? 's' : ''} ready — press Save</span>}
        </div>
      )}
      {error && <span className="price-row__error">{error}</span>}
    </div>
  );
}

/** Edit built-in products (price, name, description, stock, images). `products` already has overrides applied. */
export default function ProductEditor({ products, onSaved }: { products: Product[]; onSaved: () => void }) {
  const [filter, setFilter] = useState('');
  const overrides = getProductOverrides();
  const q = filter.trim().toLowerCase();
  const shown = products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.category.includes(q));

  return (
    <div className="admin__list" style={{ marginTop: 20 }}>
      <h2 className="admin__section-title">Edit built-in products ({products.length})</h2>
      <input
        className="admin__input"
        placeholder="Search by name or category"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <div className="price-list">
        {shown.map((p) => (
          // key includes the saved values so a saved/reset row re-reads its inputs
          <ProductRow key={`${p.id}-${p.price}-${p.originalPrice ?? ''}-${p.name}-${p.stock ?? ''}-${p.category}-${p.sizes.join()}-${p.colors.join()}-${p.images[0]?.length}`} product={p} overridden={!!overrides[p.id]} onSaved={onSaved} />
        ))}
        {shown.length === 0 && <p className="admin__empty">No products match.</p>}
      </div>
    </div>
  );
}
