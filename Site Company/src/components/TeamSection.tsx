import { motion } from "framer-motion";
import team1 from "@/assets/team-1.jpg";
import team2 from "@/assets/team-2.jpg";
import team3 from "@/assets/team-3.jpg";

const members = [
  { name: "Marco Rossi", role: "Responsabile Idraulica", img: team1 },
  { name: "Laura Bianchi", role: "Responsabile Elettricità", img: team2 },
  { name: "Giuseppe Verdi", role: "Responsabile Giardinaggio", img: team3 },
];

const TeamSection = () => (
  <section id="team" className="section-padding bg-muted/50">
    <div className="container-tight">
      <div className="text-center mb-14">
        <span className="text-sm font-semibold uppercase tracking-wider text-primary">Il Nostro Team</span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-secondary mt-2">
          Professionisti al tuo servizio
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {members.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="bg-card rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-shadow text-center"
          >
            <img src={m.img} alt={m.name} className="w-full h-64 object-cover" />
            <div className="p-5">
              <h3 className="font-bold text-secondary text-lg">{m.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{m.role}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TeamSection;
