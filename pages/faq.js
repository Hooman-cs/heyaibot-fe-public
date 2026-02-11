import Navbar from '../app/Navbar'; // Import added
import Footer from '../app/Footer';

export default function FAQ() {
  const faqs = [
    { q: "Do I need coding skills?", a: "No! You just copy and paste one line of code onto your website." },
    { q: "Can I customize the colors?", a: "Yes, you can match the chatbot to your brand colors and logo." },
    { q: "Does it work on mobile?", a: "Absolutely. The widget is fully responsive and mobile-friendly." },
    { q: "Is there a free trial?", a: "Yes, we offer a 14-day free trial on the Starter plan." },
  ];

  return (
    <>
      <Navbar />
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Frequently Asked Questions</h2>
          </div>
          <div className="mx-auto max-w-4xl divide-y divide-gray-900/10">
            {faqs.map((faq) => (
              <div key={faq.q} className="py-8">
                <h3 className="text-lg font-semibold leading-7 text-gray-900">{faq.q}</h3>
                <p className="mt-2 text-base leading-7 text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}