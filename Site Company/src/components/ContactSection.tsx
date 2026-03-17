import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const contactInfo = [
  { icon: Phone, label: "Telefono", value: "012 345 6789" },
  { icon: Mail, label: "Email", value: "info@homepro.it" },
  { icon: MapPin, label: "Indirizzo", value: "Via Roma 42, 00100 Roma, Italia" },
  { icon: Clock, label: "Orari", value: "Lun–Ven 8:00–18:00 | Sab 9:00–13:00" },
];

const ContactSection = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Richiesta inviata!", description: "Ti ricontatteremo al più presto." });
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <section id="contatti" className="section-padding">
      <div className="container-tight">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Contatti</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-secondary mt-2">
            Richiedi un preventivo gratuito
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Input placeholder="Nome *" required name="name" maxLength={100} />
              <Input placeholder="Cognome *" required name="surname" maxLength={100} />
            </div>
            <Input placeholder="Email *" type="email" required name="email" maxLength={255} />
            <Input placeholder="Telefono" type="tel" name="phone" maxLength={20} />
            <select
              name="service"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              defaultValue=""
            >
              <option value="" disabled>Seleziona un servizio</option>
              <option>Idraulica</option>
              <option>Elettricità</option>
              <option>Giardinaggio</option>
              <option>Pulizie</option>
              <option>Manutenzione</option>
            </select>
            <Textarea placeholder="Descrivi il tuo problema o la tua richiesta *" required name="message" rows={4} maxLength={1000} />
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Invio in corso..." : "Invia Richiesta"}
            </Button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {contactInfo.map((c) => (
              <div key={c.label} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <c.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-secondary">{c.label}</div>
                  <div className="text-sm text-muted-foreground">{c.value}</div>
                </div>
              </div>
            ))}

            <div className="rounded-lg overflow-hidden mt-6 h-56">
              <iframe
                title="Mappa sede"
                src="https://www.openstreetmap.org/export/embed.html?bbox=12.45%2C41.88%2C12.52%2C41.92&layer=mapnik"
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
