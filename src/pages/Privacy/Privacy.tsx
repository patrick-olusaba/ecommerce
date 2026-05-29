import useDocumentTitle from '../../hooks/useDocumentTitle';
import './Privacy.css';

export default function Privacy() {
  useDocumentTitle('Privacy Policy');
  return (
    <div className="privacy">
      <div className="privacy__container">
        <h1 className="privacy__title">Privacy Policy</h1>
        <p className="privacy__updated">Last updated: January 2025</p>

        <section className="privacy__section">
          <h2>1. Information We Collect</h2>
          <p>
            When you use AVYTRENDY, we may collect personal information you provide directly, such as your name,
            email address, phone number, shipping address, and payment details when you create an account, place
            an order, or contact our support team. We also collect information automatically, including IP address,
            browser type, device information, and browsing behavior on our site.
          </p>
        </section>

        <section className="privacy__section">
          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Process and fulfill your orders, including shipping and returns</li>
            <li>Communicate with you about your orders, account, and promotions</li>
            <li>Improve our website, products, and customer experience</li>
            <li>Send marketing emails (you can unsubscribe at any time)</li>
            <li>Prevent fraud and ensure the security of our platform</li>
          </ul>
        </section>

        <section className="privacy__section">
          <h2>3. Payment Information</h2>
          <p>
            We accept M-Pesa and Cash on Delivery. Payment information processed through M-Pesa is handled
            securely and we do not store your M-Pesa PIN or full payment credentials on our servers. All
            payment processing complies with PCI DSS standards.
          </p>
        </section>

        <section className="privacy__section">
          <h2>4. Cookies</h2>
          <p>
            We use cookies and similar technologies to keep you signed in, remember your preferences,
            understand how you use our site, and personalize your shopping experience. You can manage
            cookie preferences in your browser settings. Disabling cookies may affect site functionality.
          </p>
        </section>

        <section className="privacy__section">
          <h2>5. Data Sharing</h2>
          <p>
            We do not sell your personal information. We may share data with trusted third parties who
            help us operate our website and fulfill orders, including shipping partners, payment processors,
            and analytics providers. These partners are contractually obligated to protect your data.
          </p>
        </section>

        <section className="privacy__section">
          <h2>6. Data Security</h2>
          <p>
            We implement reasonable security measures to protect your personal information from unauthorized
            access, alteration, disclosure, or destruction. However, no internet transmission is 100% secure,
            and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="privacy__section">
          <h2>7. Your Rights</h2>
          <p>
            You have the right to access, update, or delete your personal information. You can manage your
            account details in your account settings or contact us at support@avytrendy.co.ke for assistance.
            We will respond to data requests within 30 days.
          </p>
        </section>

        <section className="privacy__section">
          <h2>8. Children's Privacy</h2>
          <p>
            AVYTRENDY is not intended for children under 13. We do not knowingly collect personal
            information from children. If you believe a child has provided us with personal data,
            please contact us immediately.
          </p>
        </section>

        <section className="privacy__section">
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page
            with an updated date. We encourage you to review this policy periodically.
          </p>
        </section>

        <section className="privacy__section">
          <h2>10. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our data practices, contact us at{' '}
            <a href="mailto:support@avytrendy.co.ke">support@avytrendy.co.ke</a> or visit our{' '}
            <a href="/contact">Contact page</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
