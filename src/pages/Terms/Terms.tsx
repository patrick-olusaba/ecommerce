import { Link } from 'react-router-dom';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import '../Privacy/Privacy.css';

export default function Terms() {
  useDocumentTitle('Terms & Conditions');
  return (
    <div className="privacy">
      <div className="privacy__container">
        <h1 className="privacy__title">Terms &amp; Conditions</h1>

        <section className="privacy__section">
          <h2>1. Using This Site</h2>
          <p>
            By using AVYTRENDY you agree to these terms. You must provide accurate information when
            creating an account or placing an order.
          </p>
        </section>

        <section className="privacy__section">
          <h2>2. Orders &amp; Pricing</h2>
          <p>
            All prices are in Kenyan Shillings (KSh). An order is confirmed once we accept it; we may cancel
            an order if an item is out of stock or a price was listed in error, and we will refund any payment made.
          </p>
        </section>

        <section className="privacy__section">
          <h2>3. Payment</h2>
          <p>We accept M-Pesa and Cash on Delivery.</p>
        </section>

        <section className="privacy__section">
          <h2>4. Delivery</h2>
          <p>
            Delivery is free on orders above KSh 5,000 and KSh 400 on smaller orders. Delivery times are
            estimates and may vary by location.
          </p>
        </section>

        <section className="privacy__section">
          <h2>5. Returns</h2>
          <p>See our <Link to="/returns">Returns &amp; Refunds</Link> policy.</p>
        </section>

        <section className="privacy__section">
          <h2>6. Liability</h2>
          <p>
            We do our best to keep product information accurate, but colours may vary slightly by screen.
            Our liability is limited to the value of the order.
          </p>
        </section>

        <section className="privacy__section">
          <h2>7. Contact</h2>
          <p>Questions? Email support@avytrendy.co.ke. See also our <Link to="/privacy">Privacy Policy</Link>.</p>
        </section>
      </div>
    </div>
  );
}
