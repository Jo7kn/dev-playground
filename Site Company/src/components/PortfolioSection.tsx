import { motion } from "framer-motion";
import p1 from "@/assets/portfolio-1.jpg";
import p2 from "@/assets/portfolio-2.jpg";
import p3 from "@/assets/portfolio-3.jpg";
import p4 from "@/assets/portfolio-4.jpg";

const projects = [
  { img: p1, title: "Ristrutturazione Bagno", cat: "Idraulica" },
  { img: p2, title: "Giardino Residenziale", cat: "Giardinaggio" },
  { img: p3, title: "Impianto Elettrico Cucina", cat: "Elettricità" },
  { img: p4, title: "Pulizia Post-Ristrutturazione", cat: "Pulizie" },
];

const PortfolioSection = () => (
  <section id="portfolio" className="section-padding bg-muted/50">
    <div className="container-tight">
      <div className="text-center mb-14">
        <span className="text-sm font-semibold uppercase tracking-wider text-primary">Portfolio</span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-secondary mt-2">
          I nostri lavori
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {projects.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="group relative rounded-lg overflow-hidden shadow-card"
          >
            <img src={p.img} alt={p.title} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-secondary/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
              <h3 className="text-secondary-foreground font-bold text-lg">{p.title}</h3>
              <span className="text-secondary-foreground/80 text-sm mt-1">{p.cat}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default PortfolioSection;
