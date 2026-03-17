import { useState } from "react";
import { Phone, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Servizi", href: "#servizi" },
  { label: "Chi Siamo", href: "#chi-siamo" },
  { label: "Team", href: "#team" },
  { label: "Testimonianze", href: "#testimonianze" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Contatti", href: "#contatti" },
];

const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="container-tight flex items-center justify-between h-16 px-4">
        <a href="#home" className="font-display text-xl font-extrabold tracking-tight text-secondary">
          HomePro<span className="text-primary">.</span>
        </a>

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors rounded-md"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <a href="tel:+390123456789" className="flex items-center gap-2 text-sm font-medium text-primary">
            <Phone className="h-4 w-4" />
            012 345 6789
          </a>
          <Button asChild size="sm">
            <a href="#contatti">Preventivo Gratuito</a>
          </Button>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden p-2 text-foreground"
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-background border-b border-border px-4 pb-4">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium text-foreground/80 hover:text-primary"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-3 flex flex-col gap-2">
            <a href="tel:+390123456789" className="flex items-center gap-2 text-sm font-medium text-primary">
              <Phone className="h-4 w-4" />
              012 345 6789
            </a>
            <Button asChild size="sm">
              <a href="#contatti">Preventivo Gratuito</a>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
