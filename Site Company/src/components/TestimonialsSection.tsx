import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  { name: "Anna M.", rating: 5, text: "Servizio impeccabile! Hanno risolto il problema idraulico in pochissimo tempo. Professionali e puntuali. Consigliatissimi!", location: "Roma" },
  { name: "Francesco L.", rating: 5, text: "Giardino completamente trasformato. Il team è stato attento a ogni dettaglio e il risultato ha superato le aspettative.", location: "Milano" },
  { name: "Giulia P.", rating: 5, text: "Pulizia straordinaria della casa dopo la ristrutturazione. Lavoro meticoloso e personale molto cortese.", location: "Napoli" },
  { name: "Roberto D.", rating: 4, text: "Impianto elettrico rifatto con grande competenza. Preventivo rispettato e lavoro completato nei tempi previsti.", location: "Torino" },
];

const TestimonialsSection = () => (
  <section id="testimonianze" className="section-padding">
    <div className="container-tight">
      <div className="text-center mb-14">
        <span className="text-sm font-semibold uppercase tracking-wider text-primary">Testimonianze</span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-secondary mt-2">
          Cosa dicono i nostri clienti
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="bg-card rounded-lg p-6 shadow-card"
          >
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: 5 }).map((_, si) => (
                <Star
                  key={si}
                  className={`h-4 w-4 ${si < t.rating ? "fill-primary text-primary" : "text-border"}`}
                />
              ))}
            </div>
            <p className="text-sm text-foreground leading-relaxed mb-4 italic">"{t.text}"</p>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-secondary text-sm">{t.name}</span>
              <span className="text-xs text-muted-foreground">{t.location}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
