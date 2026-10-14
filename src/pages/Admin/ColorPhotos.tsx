import type { Product } from '../../types';

/** One photo picker per colour, so the same product can show different photos per colour. */
export default function ColorPhotos({ colors, existing, files, onPick }: {
  colors: string[];
  existing?: Product['colorImages'];
  files: Record<string, File[]>;
  onPick: (color: string, files: File[]) => void;
}) {
  if (colors.length < 2) return null;
  return (
    <div className="admin__field">
      <label className="admin__label">Photos per colour <span className="admin__label-hint">(optional — a colour without its own photos shows the main images)</span></label>
      {colors.map((color) => (
        <div key={color} className="color-photos__row">
          <strong>{color}</strong>
          {(existing?.[color] ?? []).length > 0 && !files[color]?.length && (
            <div className="admin__previews">
              {existing![color].map((src, i) => <img key={i} src={src} alt={`${color} ${i + 1}`} className="admin__preview-img" />)}
            </div>
          )}
          <input
            className="admin__input admin__file"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => onPick(color, Array.from(e.target.files ?? []))}
          />
          {files[color]?.length ? <small>{files[color].length} new photo(s) — will replace this colour's photos</small> : null}
        </div>
      ))}
    </div>
  );
}
