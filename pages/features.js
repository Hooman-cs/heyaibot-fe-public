import Navbar from '../app/Navbar'; // Import added
import Footer from '../app/Footer'; // Import added

export default function Features() {
  const features = [
    { title: "Business-Controlled AI", desc: "Define your exact answers. The AI never invents facts." },
    { title: "Action Triggers", desc: "Open WhatsApp, book demos, or link to specific pages automatically." },
    { title: "Lead Generation", desc: "Captures name, email, and intent from chat conversations." },
    { title: "24/7 Availability", desc: "Never miss a customer query, even when you sleep." },
    { title: "Multi-Platform", desc: "Works on WordPress, React, Shopify, and custom HTML sites." },
    { title: "Analytics", desc: "Track conversation volume and lead quality in your dashboard." },
  ];

  return (
    <div className="py-24 bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Everything you need</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Features that drive growth
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.title} className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <span className="text-white text-xl">✓</span>
                  </div>
                  {feature.title}
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">{feature.desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <Footer />
    </div>
  );
}