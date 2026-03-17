import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const values = [
  "Qualità garantita su ogni intervento",
  "Preventivi trasparenti e senza sorprese",
  "Tecnici qualificati e certificati",
  "Assistenza clienti 7 giorni su 7",
];

const AboutSection = () => (
  <section id="chi-siamo" className="section-padding">
    <div className="container-tight">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Chi Siamo</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-secondary mt-2 mb-6">
            Oltre 15 anni di esperienza al servizio della tua casa
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            HomePro nasce dalla passione per l'eccellenza nei servizi domestici. Da oltre 15 anni aiutiamo
            famiglie e aziende a mantenere i propri spazi in condizioni perfette, con interventi rapidi,
            professionali e a prezzi competitivi.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-8">
            La nostra missione è semplice: rendere la manutenzione della casa semplice, affidabile e accessibile
            a tutti. Ogni membro del nostro team è selezionato per competenza, affidabilità e dedizione.
          </p>
          <ul className="space-y-3">
            {values.map((v) => (
              <li key={v} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">{v}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 gap-4"
        >
          {[
            { num: "15+", label: "Anni di esperienza" },
            { num: "2.500+", label: "Lavori completati" },
            { num: "98%", label: "Clienti soddisfatti" },
            { num: "24h", label: "Tempo di risposta" },
          ].map((s) => (
            <div key={s.label} className="bg-muted rounded-lg p-6 text-center">
              <div className="text-3xl font-extrabold text-primary mb-1">{s.num}</div>
              <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  </section>
);

export default AboutSection;
