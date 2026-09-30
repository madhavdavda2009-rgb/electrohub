import React from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import NotFound from './NotFound';

const PAGES = {
  contact: {
    title: 'Contact us',
    body: [
      ['Customer care', 'Email support@stylehub.example or call 1800-000-0000 (toll free), 24x7.'],
      ['Order questions', 'For anything about an existing order, open My Orders and use the order number when you get in touch. It helps us find your order quickly.'],
      ['Corporate office', 'StyleHub Retail Pvt. Ltd., 12 MG Road, Bengaluru 560001.'],
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    body: [
      ['How do I search with a photo?', 'Tap the camera icon in the search bar. Take a photo or choose one from your gallery, and StyleHub recognises the item and its colour and shows similar products. The photo is analysed on your device and never uploaded.'],
      ['How do coupons work?', 'Enter a code such as WELCOME10 in your bag. The discount is checked against your bag total and applied at checkout.'],
      ['Can I cancel an order?', 'Yes. Orders that have not shipped yet can be cancelled from My Orders.'],
      ['Is cash on delivery available?', 'Yes, you can pick Cash on Delivery at checkout.'],
      ['How do I switch to dark mode?', 'Use the moon/sun icon in the header, or choose Light, Dark or System under Profile → Appearance.'],
    ],
  },
  shipping: {
    title: 'Shipping',
    body: [
      ['Delivery times', 'Most orders arrive within 3-5 business days. Remote areas can take up to 7 days.'],
      ['Delivery charges', 'Delivery is free on orders above ₹999. A ₹99 convenience fee applies to smaller orders.'],
      ['Check your pincode', 'Enter your pincode on any product page to see the expected delivery date.'],
    ],
  },
  returns: {
    title: 'Returns & exchanges',
    body: [
      ['14-day returns', 'Most items can be returned or exchanged within 14 days of delivery, unused and with original tags.'],
      ['Non-returnable items', 'Innerwear, beauty products that have been opened, and personalised items cannot be returned for hygiene reasons.'],
      ['Refunds', 'Refunds go back to your original payment method within 5-7 business days after pickup.'],
    ],
  },
  terms: {
    title: 'Terms of use',
    body: [
      ['Demo store', 'StyleHub is a demonstration store. No real payments are taken and no products are shipped.'],
      ['Accounts', 'You are responsible for keeping your password safe and for activity on your account.'],
      ['Pricing', 'Prices and offers can change without notice. The price at the time of order is the price you pay.'],
    ],
  },
  privacy: {
    title: 'Privacy policy',
    body: [
      ['What we store', 'Your name, email, phone, addresses and orders, so that we can deliver your purchases.'],
      ['Photos for visual search', 'Photos you use to search are processed in your browser and are never uploaded to our servers.'],
      ['On your device', 'Your theme choice, recent searches and recently viewed products are stored only in your browser.'],
    ],
  },
};

const HelpPage = () => {
  const { slug } = useParams();
  const page = PAGES[slug];
  if (!page) return <NotFound />;

  return (
    <div className="container-x grid gap-10 py-10 md:grid-cols-[220px_1fr] md:py-14">
      <aside className="min-w-0">
        <p className="label mb-3">Help centre</p>
        <nav className="flex gap-2 overflow-x-auto hide-scrollbar md:flex-col md:gap-1">
          {Object.entries(PAGES).map(([key, p]) => (
            <NavLink key={key} to={`/help/${key}`} className={({ isActive }) => `shrink-0 rounded-xl px-3 py-2 text-sm font-bold transition ${isActive ? 'bg-ink text-on-ink' : 'text-fg hover:bg-surface-2'}`}>
              {p.title}
            </NavLink>
          ))}
        </nav>
      </aside>
      <article className="min-w-0 max-w-2xl">
        <h1 className="section-title">{page.title}</h1>
        <div className="mt-8 space-y-4">
          {page.body.map(([heading, text]) => (
            <section key={heading} className="card p-5">
              <h2 className="font-extrabold">{heading}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
            </section>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted">Still need help? <Link to="/help/contact" className="link">Contact us</Link>.</p>
      </article>
    </div>
  );
};

export default HelpPage;
