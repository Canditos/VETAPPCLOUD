const services = [
  {
    id: "patients",
    name: "Patient Management API",
    endpoint: "/api/patients",
    methods: ["GET", "POST"],
    description: "Criação e gestão de fichas clínicas dos pacientes.",
  },
  {
    id: "appointments",
    name: "Agenda API",
    endpoint: "/api/appointments",
    methods: ["GET", "POST"],
    description: "Marcação e gestão de consultas e agenda clínica.",
  },
  {
    id: "customers",
    name: "Customer Data API",
    endpoint: "/api/customers",
    methods: ["GET", "POST"],
    description: "Gestão de clientes, dados fiscais e contactos.",
  },
];

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="space-y-4">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">VetApp Cloud</p>
          <h1 className="text-4xl font-black tracking-tight">Documentação API</h1>
          <p className="max-w-2xl text-slate-300">
            Catálogo público dos endpoints principais expostos pela plataforma para integrações internas e automação.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {services.map((service) => (
            <section
              key={service.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black">{service.name}</h2>
                  <p className="mt-2 text-sm text-slate-300">{service.description}</p>
                </div>
                <div className="flex gap-2">
                  {service.methods.map((method) => (
                    <span
                      key={method}
                      className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black uppercase tracking-widest text-blue-300"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-950 px-4 py-3 font-mono text-sm text-emerald-300">
                {service.endpoint}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
