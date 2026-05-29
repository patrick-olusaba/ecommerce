import { useState } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import './SizeGuide.css';

const clothingSizes = [
  { size: 'XS', chest: '32-34"', waist: '26-28"', hip: '34-36"', ke: 'XXS' },
  { size: 'S', chest: '35-37"', waist: '29-31"', hip: '37-39"', ke: 'XS' },
  { size: 'M', chest: '38-40"', waist: '32-34"', hip: '40-42"', ke: 'S' },
  { size: 'L', chest: '41-43"', waist: '35-37"', hip: '43-45"', ke: 'M' },
  { size: 'XL', chest: '44-46"', waist: '38-40"', hip: '46-48"', ke: 'L' },
  { size: '2XL', chest: '47-49"', waist: '41-43"', hip: '49-51"', ke: 'XL' },
];

const watchSizes = [
  { case: '36-38mm', style: 'Small / Vintage', wrist: '5.5-6.5"', best: 'Petite wrists, classic look' },
  { case: '40-42mm', style: 'Medium / Standard', wrist: '6.5-7.5"', best: 'Most wrists, everyday wear' },
  { case: '44-46mm', style: 'Large / Sport', wrist: '7.0-8.0"', best: 'Bold statement, sporty styles' },
  { case: '48mm+', style: 'Oversized', wrist: '7.5"+', best: 'Diver & pilot watches' },
];

const shoeSizes = [
  { uk: '4', us: '5', eu: '36', cm: '22.5' },
  { uk: '5', us: '6', eu: '37', cm: '23.5' },
  { uk: '6', us: '7', eu: '38', cm: '24.5' },
  { uk: '7', us: '8', eu: '39', cm: '25.5' },
  { uk: '8', us: '9', eu: '40', cm: '26.5' },
  { uk: '9', us: '10', eu: '41', cm: '27.5' },
  { uk: '10', us: '11', eu: '42', cm: '28.5' },
  { uk: '11', us: '12', eu: '43', cm: '29.5' },
];

const tips = [
  { title: 'How to Measure — Chest', desc: 'Wrap a measuring tape around the fullest part of your chest, under your arms. Keep the tape comfortably loose — not tight, not drooping.' },
  { title: 'How to Measure — Waist', desc: 'Measure around your natural waistline (the narrowest part), usually just above your belly button. Relax your stomach for an accurate reading.' },
  { title: 'How to Measure — Hips', desc: 'Stand with your feet together. Measure around the fullest part of your hips and buttocks, about 7-9 inches below your waist.' },
  { title: 'Between Sizes?', desc: 'If you fall between two sizes, we recommend sizing up for a relaxed fit or sizing down for a slim fit. Check product reviews for fit feedback from other customers.' },
  { title: 'Watch Sizing', desc: 'For watches, measure your wrist with a flexible tape just below the wrist bone. Most of our watches have adjustable straps and removable links for a custom fit.' },
];

type Tab = 'clothing' | 'watches' | 'shoes';

export default function SizeGuide() {
  useDocumentTitle('Size Guide');
  const [tab, setTab] = useState<Tab>('clothing');

  return (
    <div className="size-guide">
      <div className="size-guide__container">
        <h1 className="size-guide__title">Size Guide</h1>
        <p className="size-guide__subtitle">Find your perfect fit with our detailed sizing charts.</p>

        <div className="size-guide__tabs">
          {(['clothing', 'watches', 'shoes'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`size-guide__tab ${tab === t ? 'size-guide__tab--active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'clothing' ? 'Clothing' : t === 'watches' ? 'Watches' : 'Shoes'}
            </button>
          ))}
        </div>

        {tab === 'clothing' && (
          <div className="size-guide__table-wrap">
            <table className="size-guide__table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Chest</th>
                  <th>Waist</th>
                  <th>Hip</th>
                  <th>KE Equivalent</th>
                </tr>
              </thead>
              <tbody>
                {clothingSizes.map((row) => (
                  <tr key={row.size}>
                    <td className="size-guide__size">{row.size}</td>
                    <td>{row.chest}</td>
                    <td>{row.waist}</td>
                    <td>{row.hip}</td>
                    <td>{row.ke}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="size-guide__note">
              Kenyan sizing tends to run slightly smaller than international sizes. Use the KE Equivalent
              column as reference. When in doubt, order one size up for a comfortable fit.
            </p>
          </div>
        )}

        {tab === 'watches' && (
          <div className="size-guide__table-wrap">
            <table className="size-guide__table">
              <thead>
                <tr>
                  <th>Case Diameter</th>
                  <th>Style</th>
                  <th>Fits Wrist</th>
                  <th>Best For</th>
                </tr>
              </thead>
              <tbody>
                {watchSizes.map((row) => (
                  <tr key={row.case}>
                    <td className="size-guide__size">{row.case}</td>
                    <td>{row.style}</td>
                    <td>{row.wrist}</td>
                    <td>{row.best}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'shoes' && (
          <div className="size-guide__table-wrap">
            <table className="size-guide__table">
              <thead>
                <tr>
                  <th>UK</th>
                  <th>US</th>
                  <th>EU</th>
                  <th>CM</th>
                </tr>
              </thead>
              <tbody>
                {shoeSizes.map((row) => (
                  <tr key={row.uk}>
                    <td className="size-guide__size">{row.uk}</td>
                    <td>{row.us}</td>
                    <td>{row.eu}</td>
                    <td>{row.cm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="size-guide__tips">
          <h2>Measuring Tips</h2>
          <div className="size-guide__tips-grid">
            {tips.map((tip) => (
              <div key={tip.title} className="size-guide__tip">
                <h3>{tip.title}</h3>
                <p>{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="size-guide__help">
          <p>
            Still unsure about your size?{' '}
            <a href="/contact">Contact our support team</a> — we're happy to help.
          </p>
        </div>
      </div>
    </div>
  );
}
