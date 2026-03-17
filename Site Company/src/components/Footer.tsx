import { Facebook, Instagram, Linkedin } from "lucide-react";

const Footer = () => (
  <footer className="bg-secondary text-secondary-foreground">
    <div className="container-tight px-4 py-14">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <h3 className="font-display text-xl font-extrabold mb-4">
            HomePro<span className="text-primary">.</span>
          </h3>
          <p className="text-sm text-secondary-foreground/70 leading-relaxed">
            Servizi professionali per la casa dal 2009. Qualità, affidabilità e trasparenza in ogni intervento.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Servizi</h4>
          <ul className="space-y-2 text-sm text-secondary-foreground/70">
            <li><a href="#servizi" className="hover:text-primary transition-colors">Idraulica</a></li>
            <li><a href="#servizi" className="hover:text-primary transition-colors">Elettricità</a></li>
            <li><a href="#servizi" className="hover:text-primary transition-colors">Giardinaggio</a></li>
            <li><a href="#servizi" className="hover:text-primary transition-colors">Pulizie</a></li>
            <li><a href="#servizi" className="hover:text-primary transition-colors">Manutenzione</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Link Utili</h4>
          <ul className="space-y-2 text-sm text-secondary-foreground/70">
            <li><a href="#chi-siamo" className="hover:text-primary transition-colors">Chi Siamo</a></li>
            <li><a href="#team" className="hover:text-primary transition-colors">Il Team</a></li>
            <li><a href="#testimonianze" className="hover:text-primary transition-colors">Testimonianze</a></li>
            <li><a href="#portfolio" className="hover:text-primary transition-colors">Portfolio</a></li>
            <li><a href="#contatti" className="hover:text-primary transition-colors">Contatti</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Seguici</h4>
          <div className="flex gap-3">
            <a href="#" aria-label="Facebook" className="w-10 h-10 rounded-lg bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" aria-label="Instagram" className="w-10 h-10 rounded-lg bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" aria-label="LinkedIn" className="w-10 h-10 rounded-lg bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-secondary-foreground/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-secondary-foreground/50">
        <p>© {new Date().getFullYear()} HomePro. Tutti i diritti riservati.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-secondary-foreground transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-secondary-foreground transition-colors">Termini e Condizioni</a>
          <a href="#" className="hover:text-secondary-foreground transition-colors">Cookie Policy</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
