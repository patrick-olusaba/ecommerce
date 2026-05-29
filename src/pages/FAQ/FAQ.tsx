import useDocumentTitle from '../../hooks/useDocumentTitle';
import './FAQ.css';

const FAQS = [
  {
    section: 'Shipping & Delivery',
    items: [
      {
        q: 'How long does delivery take?',
        a: 'Orders within Nairobi are delivered in 24-48 hours. Nationwide shipping to other counties takes 2-5 business days depending on your location.',
      },
      {
        q: 'How much does shipping cost?',
        a: 'Shipping is free for orders over KSh 5,000. For orders below that, a flat rate of KSh 350 applies for deliveries within Kenya.',
      },
      {
        q: 'Do you ship internationally?',
        a: 'Currently we only ship within Kenya. We\'re working on expanding to East African countries — stay tuned!',
      },
      {
        q: 'How can I track my order?',
        a: 'Visit our Track Order page and enter your order number (e.g., AVT-100101). You\'ll see real-time updates on your delivery status.',
      },
    ],
  },
  {
    section: 'Returns & Refunds',
    items: [
      {
        q: 'What is your return policy?',
        a: 'We offer a 30-day return policy for most items. Products must be unworn, unwashed, and in their original packaging with tags attached.',
      },
      {
        q: 'How do I return an item?',
        a: 'Contact our support team at support@avytrendy.co.ke with your order number and the item(s) you\'d like to return. We\'ll guide you through the process.',
      },
      {
        q: 'How long do refunds take?',
        a: 'Once we receive and inspect your return, refunds are processed within 5-7 business days. M-Pesa refunds typically reflect within 48 hours.',
      },
      {
        q: 'Can I exchange an item?',
        a: 'Yes, you can exchange for a different size or color. Contact us within 7 days of delivery and we\'ll arrange the exchange at no extra shipping cost.',
      },
    ],
  },
  {
    section: 'Payment',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept M-Pesa and Cash on Delivery (COD). More payment options are coming soon.',
      },
      {
        q: 'How does M-Pesa payment work?',
        a: 'Select M-Pesa at checkout and enter your M-Pesa phone number. You\'ll receive an STK push notification on your phone — simply enter your PIN to complete payment.',
      },
      {
        q: 'Is Cash on Delivery safe?',
        a: 'Absolutely. You only pay when your order arrives at your doorstep. Our delivery team will call before arriving and you can inspect the package before paying.',
      },
      {
        q: 'Do you store my payment information?',
        a: 'No. We never store your M-Pesa PIN or any sensitive payment details. All transactions are processed through Safaricom\'s secure payment gateway.',
      },
    ],
  },
  {
    section: 'Sizing & Products',
    items: [
      {
        q: 'How do I find my size?',
        a: 'Each product page includes a size guide with measurements. If you\'re between sizes, we recommend sizing up for a comfortable fit.',
      },
      {
        q: 'Are the product images accurate?',
        a: 'We do our best to show accurate colors and details. Slight variations may occur due to screen settings, but we photograph all products in natural light.',
      },
      {
        q: 'Do you restock sold-out items?',
        a: 'Popular items are restocked regularly. Sign up for our newsletter to get notified when your favorite items are back in stock.',
      },
      {
        q: 'Can I cancel my order?',
        a: 'You can cancel within 2 hours of placing your order. After that, the order enters processing and cannot be cancelled. Contact support immediately if you need to cancel.',
      },
    ],
  },
  {
    section: 'Account & Privacy',
    items: [
      {
        q: 'Do I need an account to shop?',
        a: 'No, you can shop as a guest. Simply add items to your cart and check out. We recommend subscribing to our newsletter for order updates and promotions.',
      },
      {
        q: 'How is my personal information used?',
        a: 'We only use your information to process orders and improve your shopping experience. We never sell or share your data with third parties.',
      },
      {
        q: 'How do I contact customer support?',
        a: 'You can reach us via email at support@avytrendy.co.ke, call or WhatsApp at +254 707 855 708, or use the contact form on our Contact page.',
      },
    ],
  },
];

export default function FAQ() {
  useDocumentTitle('FAQ');
  return (
    <div className="faq">
      <div className="faq__container">
        <div className="faq__hero">
          <span className="faq__overline">Help Center</span>
          <h1 className="faq__title">Frequently Asked Questions</h1>
          <p className="faq__subtitle">
            Quick answers to common questions. Can't find what you're looking for?
            <a href="/contact"> Contact us</a> and we'll be happy to help.
          </p>
        </div>

        <div className="faq__sections">
          {FAQS.map((section) => (
            <div key={section.section} className="faq__section">
              <h2 className="faq__section-title">{section.section}</h2>
              <div className="faq__list">
                {section.items.map((item) => (
                  <details key={item.q} className="faq__item">
                    <summary className="faq__question">
                      <span>{item.q}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </summary>
                    <p className="faq__answer">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
