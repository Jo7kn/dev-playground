import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, Clock, Star } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const badges = [
  { icon: Shield, text: "Professionisti Certificati" },
  { icon: Clock, text: "Interventi Rapidi" },
  { icon: Star, text: "4.9/5 Valutazione" },
];

const HeroSection = () => (
  <section
    id="home"
    className="relative min-h-[92vh] flex items-center pt-16"
  >
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: `url(${heroBg})` }}
    />
    <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />

    <div className="relative z-10 container-tight px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl"
      >
        <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-wider uppercase rounded-full bg-accent text-accent-foreground">
          Servizi per la casa a 360°
        </span>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-primary-foreground mb-6">
          La tua casa merita <br className="hidden md:block" />
          il meglio
        </h1>
        <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-lg font-body">
          Idraulica, elettricità, giardinaggio, pulizie e manutenzione.
          Professionisti esperti al tuo servizio.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <a href="#contatti">Richiedi Preventivo Gratuito</a>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <a href="#servizi">Scopri i Servizi</a>
          </Button>
        </div>

        <div className="flex flex-wrap gap-6 mt-12">
          {badges.map((b) => (
            <div key={b.text} className="flex items-center gap-2 text-primary-foreground/90">
              <b.icon className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium">{b.text}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
