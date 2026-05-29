import { useState } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { addDocument } from '../../firebase/firestore';
import './Contact.css';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
}

const STORAGE_KEY = 'avytrendy_contact_messages';

function saveMessage(msg: ContactMessage) {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  existing.push(msg);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export default function Contact() {
  useDocumentTitle('Contact');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const msg = {
      id: `MSG-${Date.now()}`,
      ...form,
      date: new Date().toISOString(),
    };
    saveMessage(msg);
    await addDocument('messages', msg);
    setSent(true);
    setForm({ name: '', email: '', subject: '', message: '' });
    setSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="contact">
      <div className="contact__container">
        {/* Hero */}
        <div className="contact__hero">
          <span className="contact__overline">Get in Touch</span>
          <h1 className="contact__title">We'd Love to Hear From You</h1>
          <p className="contact__subtitle">
            Have a question about your order, a product, or just want to say hello?
            Fill out the form below and our team will get back to you within 24 hours.
          </p>
        </div>

        <div className="contact__layout">
          {/* Form */}
          <div className="contact__form-card">
            {sent ? (
              <div className="contact__success">
                <div className="contact__success-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h3>Message Sent!</h3>
                <p>Thank you for reaching out. We'll get back to you as soon as possible.</p>
                <button className="contact__btn" onClick={() => setSent(false)}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form className="contact__form" onSubmit={handleSubmit}>
                <div className="contact__row contact__row--half">
                  <div className="contact__field">
                    <label className="contact__label">Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="contact__input"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="contact__field">
                    <label className="contact__label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      className="contact__input"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="contact__field">
                  <label className="contact__label">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    className="contact__input"
                    placeholder="How can we help?"
                    value={form.subject}
                    onChange={handleChange}
                  />
                </div>
                <div className="contact__field">
                  <label className="contact__label">Message *</label>
                  <textarea
                    name="message"
                    className="contact__input contact__textarea"
                    placeholder="Tell us more..."
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    required
                  />
                </div>
                <button type="submit" className="contact__btn" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <aside className="contact__sidebar">
            <div className="contact__info-card">
              <div className="contact__info-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h4>Email</h4>
              <p>support@avytrendy.co.ke</p>
            </div>

            <div className="contact__info-card">
              <div className="contact__info-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <h4>Phone</h4>
              <p>+254 707 855 708</p>
            </div>

            <div className="contact__info-card">
              <div className="contact__info-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <h4>Location</h4>
              <p>Nairobi, Kenya</p>
            </div>

            <div className="contact__hours">
              <h4>Business Hours</h4>
              <div className="contact__hours-row">
                <span>Monday – Friday</span>
                <span>8:00 AM – 7:00 PM</span>
              </div>
              <div className="contact__hours-row">
                <span>Saturday</span>
                <span>9:00 AM – 5:00 PM</span>
              </div>
              <div className="contact__hours-row">
                <span>Sunday</span>
                <span className="contact__hours-closed">Closed</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
