import { useEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUp, ArrowUpRight, Github, Linkedin } from 'lucide-react';
import './ReadingPortfolio.css';

const sectionOrder = [1, 6, 7, 8, 2, 3];
const sectionId = index => `reading-section-${index}`;

function ProfessionalLinks({ en }) {
  const newTab = en ? 'opens in a new tab' : 'abre em nova aba';
  return <div className="editorial-social">
    <a href="https://github.com/felipe-santos-swengineer" target="_blank" rel="noreferrer"
      aria-label={`GitHub (${newTab})`}><Github size={17} aria-hidden="true" /> GitHub</a>
    <a href="https://www.linkedin.com/in/felipe-santos-rodrigues/" target="_blank" rel="noreferrer"
      aria-label={`LinkedIn (${newTab})`}><Linkedin size={17} aria-hidden="true" /> LinkedIn</a>
  </div>;
}

export default function ReadingPortfolio({ language, places, renderSection, menuOpen, setMenuOpen }) {
  const en = language === 'en-US';
  const [activeSection, setActiveSection] = useState('');
  const root = useRef(null);
  const navigation = useRef(null);

  useEffect(() => {
    const container = root.current;
    const nav = navigation.current;
    if (!container || !nav) return;
    const updateOffset = () => container.style.setProperty('--editorial-nav-height', `${nav.offsetHeight}px`);
    updateOffset();
    const size = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateOffset) : null;
    size?.observe(nav);
    const sections = [...container.querySelectorAll('[data-editorial-section]')];
    const observer = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(entries => {
        const visible = entries.find(entry => entry.isIntersecting);
        if (visible) setActiveSection(visible.target.id);
      }, { rootMargin: '-23% 0px -66% 0px' })
      : null;
    sections.forEach(section => observer?.observe(section));
    return () => { size?.disconnect(); observer?.disconnect(); };
  }, []);

  const goToSection = id => {
    setActiveSection(id);
    if (window.matchMedia?.('(max-width: 800px)').matches) setMenuOpen(false);
  };
  const sectionLink = (id, label) => (
    <a href={`#${id}`} key={id} onClick={() => goToSection(id)}
      aria-current={activeSection === id ? 'location' : undefined}>{label}</a>
  );

  return <div className="editorial" ref={root}>
    <nav className="editorial-index" ref={navigation} aria-label={en ? 'Portfolio sections' : 'Seções do portfólio'}>
      <button type="button" className="editorial-index-toggle" aria-expanded={menuOpen}
        aria-controls="reading-menu-links" onClick={() => setMenuOpen(open => !open)}>
        {menuOpen ? (en ? 'Collapse menu' : 'Recolher menu') : (en ? 'Open menu' : 'Abrir menu')}
        <span aria-hidden="true">{menuOpen ? '−' : '+'}</span>
      </button>
      <div id="reading-menu-links" className="editorial-index-links" hidden={!menuOpen}>
        {sectionOrder.map(index => sectionLink(sectionId(index), places[index].section))}
      </div>
    </nav>

    <section className="editorial-hero" aria-labelledby="editorial-name">
      <div className="editorial-hero-copy">
        <p className="editorial-role">{en ? 'Software Engineer · Full-stack Developer' : 'Engenheiro de Software · Desenvolvedor Full-stack'}</p>
        <h1 id="editorial-name">Felipe <em>Santos</em></h1>
        <p className="editorial-lead">{en
          ? 'I build web applications across the stack, from user interfaces to API integrations and relational databases.'
          : 'Desenvolvo aplicações web de ponta a ponta, da interface à integração de APIs e a bancos de dados relacionais.'}</p>
        <p className="editorial-stack">React · Next.js · Node.js · Laravel · PostgreSQL</p>
        <div className="editorial-hero-actions">
          <a className="editorial-primary" href="#reading-section-2">{en ? 'View projects' : 'Ver projetos'} <ArrowDownRight size={19} aria-hidden="true" /></a>
          <a className="editorial-secondary" href="#reading-section-3">{en ? 'Get in touch' : 'Entrar em contato'} <ArrowUpRight size={17} aria-hidden="true" /></a>
        </div>
        <ProfessionalLinks en={en} />
      </div>
      <div className="editorial-emblem" aria-hidden="true">
        <div className="editorial-emblem-rings" />
        <div className="editorial-emblem-frame"><span>F<span>S</span></span></div>
        <i /><i /><i /><i />
      </div>
    </section>

    <div className="editorial-sections">
      {sectionOrder.map(index => (
        <section className="editorial-section" id={sectionId(index)} tabIndex={-1}
          aria-labelledby={`editorial-title-${index}`} data-editorial-section key={index}>
          <h2 id={`editorial-title-${index}`}>{places[index].section}</h2>
          {renderSection(index)}
        </section>
      ))}
    </div>

    <footer className="editorial-footer">
      <div className="editorial-footer-brand"><span aria-hidden="true">FS</span> Felipe Santos</div>
      <a href="#editorial-top">{en ? 'Back to top' : 'Voltar ao topo'} <ArrowUp size={16} aria-hidden="true" /></a>
    </footer>
  </div>;
}
