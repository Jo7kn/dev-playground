import { motion } from "framer-motion";
import { Droplets, Zap, TreePine, SprayCan, Wrench } from "lucide-react";

const services = [
  { icon: Droplets, title: "Idraulica", desc: "Riparazioni, installazioni e manutenzione di impianti idraulici per bagni, cucine e riscaldamento." },
  { icon: Zap, title: "Elettricità", desc: "Impianti elettrici, illuminazione, quadri e certificazioni a norma per la sicurezza della tua casa." },
  { icon: TreePine, title: "Giardinaggio", desc: "Progettazione e cura del verde: potatura, prato, irrigazione e manutenzione stagionale." },
  { icon: SprayCan, title: "Pulizie", desc: "Pulizie professionali ordinarie e straordinarie per appartamenti, uffici e spazi commerciali." },
  { icon: Wrench, title: "Manutenzione", desc: "Piccoli e grandi interventi di manutenzione: serrature, tinteggiatura, montaggio e riparazioni." },
];

const ServicesSection = () => (
  <section id="servizi" className="section-padding bg-muted/50">
    <div className="container-tight">
      <div className="text-center mb-14">
        <span className="text-sm font-semibold uppercase tracking-wider text-primary">I Nostri Servizi</span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-secondary mt-2">
          Tutto ciò di cui la tua casa ha bisogno
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="group bg-card rounded-lg p-6 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <s.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-secondary mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ServicesSection;
