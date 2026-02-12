export default async function Home() {
  return (
    <div className="min-h-screen p-12 bg-gray-50 text-left" dir="ltr">
      <h1 className="text-4xl font-bold text-center mb-6 text-indigo-700">
        Al Asala System
      </h1>
      <p className="text-center text-gray-600 mb-10">
        Full-Stack Multi-Tenant SaaS Platform powered by Next.js, Supabase, and Stripe.
      </p>

      <div className="max-w-3xl mx-auto grid gap-4">
        <div className="bg-white p-6 rounded-2xl shadow border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Demo Links</h2>
          <p className="text-gray-600 mt-2">
            Open a restaurant page via: <span className="font-mono bg-gray-100 px-2 rounded">/{`{slug}`}</span>
          </p>
          <p className="text-gray-600 mt-2">
            Example: <span className="font-mono bg-gray-100 px-2 rounded">/alasala/menu</span>
          </p>
        </div>
      </div>
    </div>
  );
}
