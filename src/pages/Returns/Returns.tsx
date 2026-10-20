import useDocumentTitle from '../../hooks/useDocumentTitle';
import '../Privacy/Privacy.css';

export default function Returns() {
  useDocumentTitle('Returns & Refunds');
  return (
    <div className="privacy">
      <div className="privacy__container">
        <h1 className="privacy__title">Returns &amp; Refunds</h1>

        <section className="privacy__section">
          <h2>1. 7-Day Returns</h2>
          <p>
            You can return or exchange an item within 7 days of delivery. Items must be unworn, unwashed,
            with all tags attached and in the original packaging.
          </p>
        </section>

        <section className="privacy__section">
          <h2>2. How to Return</h2>
          <ul>
            <li>Email support@avytrendy.co.ke with your order number and the item(s) you want to return.</li>
            <li>We will confirm and arrange the pickup or drop-off.</li>
            <li>Once we receive and inspect the item, we process your refund or exchange.</li>
          </ul>
        </section>

        <section className="privacy__section">
          <h2>3. Refunds</h2>
          <p>
            Refunds are processed within 5-7 business days after we receive and inspect your return.
            M-Pesa refunds typically reflect within 48 hours. Refunds go back to the original payment method;
            Cash on Delivery orders are refunded via M-Pesa.
          </p>
        </section>

        <section className="privacy__section">
          <h2>4. Exchanges</h2>
          <p>
            You can exchange for a different size or colour, subject to stock, at no extra shipping cost
            if you contact us within 7 days of delivery.
          </p>
        </section>

        <section className="privacy__section">
          <h2>5. Items We Cannot Take Back</h2>
          <p>
            Items that are worn, damaged by the customer, or missing tags, and any item marked final sale.
            If you receive a faulty or wrong item, contact us right away and we will make it right.
          </p>
        </section>
      </div>
    </div>
  );
}
