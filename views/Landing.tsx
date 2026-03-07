import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LOGO_BASE64 } from '../constants/assets';
import { supabase } from '../lib/supabase';

const C = {
    orange: '#F5A000',
    orangeLight: '#FFB830',
    orangeDark: '#D47F00',
    blue: '#1565C0',
    blueLight: '#1E88E5',
    blueSky: '#64B5F6',
    bg: '#EEF4FB',
    bgSection: '#F5F9FF',
    white: '#FFFFFF',
    navy: '#1A237E',
    body: '#2C3E6B',
    muted: '#6B7BAB',
};

const Landing: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Quote form state
    const [quoteForm, setQuoteForm] = useState({
        name: '',
        phone: '',
        city: '',
        property_type: 'Residencial',
        bill_value: '',
        roof_type: 'Cerâmica',
    });
    const [quoteSubmitting, setQuoteSubmitting] = useState(false);
    const [quoteSubmitted, setQuoteSubmitted] = useState(false);

    const handleQuoteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setQuoteSubmitting(true);
        try {
            // Save lead to Supabase
            await supabase.from('leads').insert([{
                name: quoteForm.name,
                phone: quoteForm.phone.replace(/\D/g, ''),
                city: quoteForm.city,
                property_type: quoteForm.property_type,
                bill_value: parseFloat(quoteForm.bill_value) || 0,
                roof_type: quoteForm.roof_type,
                status: 'Novo',
                source: 'Site',
            }]);

            // Open WhatsApp with pre-filled message
            const msg = encodeURIComponent(
                `Olá! Vim pelo site da RVGS Elétrica e tenho interesse em energia solar.\n\n` +
                `*Nome:* ${quoteForm.name}\n` +
                `*Cidade:* ${quoteForm.city}\n` +
                `*Tipo de imóvel:* ${quoteForm.property_type}\n` +
                `*Valor médio da conta:* R$ ${quoteForm.bill_value}\n` +
                `*Tipo de telhado:* ${quoteForm.roof_type}\n\n` +
                `Aguardo contato para um estudo gratuito!`
            );
            window.open(`https://wa.me/5561993801434?text=${msg}`, '_blank');
            setQuoteSubmitted(true);
        } catch (err) {
            console.error('Erro ao salvar lead:', err);
            // Still open WhatsApp even if DB fails
            const msg = encodeURIComponent(`Olá! Vim pelo site e tenho interesse em energia solar. Meu nome é ${quoteForm.name}.`);
            window.open(`https://wa.me/5561993801434?text=${msg}`, '_blank');
        } finally {
            setQuoteSubmitting(false);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        setMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div style={{ fontFamily: 'var(--font-body)', background: C.bg, color: C.body, minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>

            {/* ── NAV ── */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px var(--container-px)',
                background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
                backdropFilter: scrolled ? 'blur(16px)' : 'none',
                borderBottom: scrolled ? `1px solid ${C.orange}33` : 'none',
                boxShadow: scrolled ? '0 2px 16px rgba(21,101,192,0.08)' : 'none',
                transition: 'all 0.3s ease',
            }}>
                <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                    <img src={LOGO_BASE64} alt="RVGS Logo" style={{ height: 'clamp(40px, 10vw, 56px)', width: 'auto', filter: `drop-shadow(0 0 10px ${C.orange}44)` }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 700, letterSpacing: '1px' }}>
                        <span style={{ color: C.orange }}>RVGS </span>
                        <span style={{ color: scrolled ? C.navy : '#FFFFFF', transition: 'color 0.3s' }}>ELÉTRICA</span>
                    </span>
                </a>

                {/* Desktop Links - Visible only on MD and up */}
                <ul className="desktop-only" style={{
                    alignItems: 'center',
                    gap: 'max(16px, 2vw)',
                    listStyle: 'none',
                    margin: 0,
                    padding: 0
                }}>
                    {['Início', 'Serviços', 'Por que nós?'].map((link, i) => (
                        <li key={link}>
                            <button
                                onClick={() => scrollToSection(['home', 'services', 'why'][i])}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: scrolled ? C.muted : 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', transition: 'color 0.2s' }}
                                onMouseEnter={e => (e.currentTarget.style.color = C.orange)}
                                onMouseLeave={e => (e.currentTarget.style.color = scrolled ? C.muted : 'rgba(255,255,255,0.7)')}
                            >
                                {link}
                            </button>
                        </li>
                    ))}
                    <li>
                        <button
                            onClick={() => scrollToSection('contact')}
                            style={{ background: C.orange, color: '#fff', border: 'none', cursor: 'pointer', padding: '10px 20px', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', boxShadow: `0 4px 16px ${C.orange}44`, transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = C.orangeLight; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = C.orange; e.currentTarget.style.transform = 'none'; }}
                        >
                            Orçamento
                        </button>
                    </li>
                </ul>

                {/* Mobile Toggle - Visible only below MD */}
                <button
                    className="flex md:hidden"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: scrolled ? C.orange : '#FFFFFF', zIndex: 1000 }}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>{mobileMenuOpen ? 'close' : 'menu'}</span>
                </button>

                {/* Mobile Menu Overlay */}
                <div style={{
                    position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
                    background: 'rgba(13, 20, 34, 0.98)',
                    zIndex: 99,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: '32px',
                    opacity: mobileMenuOpen ? 1 : 0,
                    visibility: mobileMenuOpen ? 'visible' : 'hidden',
                    transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                    {['home', 'services', 'why', 'contact'].map((id, i) => (
                        <button
                            key={id}
                            onClick={() => scrollToSection(id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FFFFFF', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '4px', textTransform: 'uppercase' }}
                        >
                            {['Início', 'Serviços', 'Por que nós?', 'Contato'][i]}
                        </button>
                    ))}
                    <img src={LOGO_BASE64} alt="RVGS" style={{ height: '60px', marginTop: '40px', opacity: 0.5 }} />
                </div>
            </nav>

            {/* ── HERO ── */}
            <header id="home" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', width: '100%' }}>
                {/* Background gradient */}
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 0,
                    background: `radial-gradient(ellipse at 15% 60%, ${C.orange}15 0%, transparent 55%),
                                 radial-gradient(ellipse at 85% 20%, ${C.blueLight}20 0%, transparent 50%),
                                 linear-gradient(135deg, #0d1422 0%, #111c2d 100%)`,
                }} className="hero-bg" />

                {/* Animated grid */}
                <div className="hero-grid" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

                {/* Solar rays spinner — canto superior direito */}
                <div className="solar-rays" style={{ position: 'absolute', top: '-100px', right: '-100px', zIndex: 0 }} />

                {/* Orb laranja pulsante — canto inferior esquerdo */}
                <div className="animate-logo-pulse" style={{
                    position: 'absolute', bottom: '-120px', left: '-80px', zIndex: 0,
                    width: 'clamp(300px, 40vw, 500px)', height: 'clamp(300px, 40vw, 500px)', borderRadius: '50%',
                    background: `radial-gradient(ellipse at center, ${C.orange}18 0%, transparent 70%)`,
                    pointerEvents: 'none',
                }} />

                {/* Wave bottom */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', overflow: 'hidden', zIndex: 1, pointerEvents: 'none' }}>
                    <svg viewBox="0 0 1440 80" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
                        <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill={`${C.orange}22`} />
                        <path d="M0,55 C480,20 960,70 1440,55 L1440,80 L0,80 Z" fill={`${C.orange}11`} />
                    </svg>
                </div>

                <div className="responsive-container" style={{ position: 'relative', zIndex: 10, paddingTop: '120px', paddingBottom: '80px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '48px', alignItems: 'center' }} className="md:grid-cols-[1fr_1.2fr]">

                        {/* Hero Image Section (Responsive Order) */}
                        <div className="order-1 md:order-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 'min(90%, 450px)' }}>
                                {/* Glow */}
                                <div className="animate-logo-pulse" style={{ position: 'absolute', inset: '-60px', background: `radial-gradient(ellipse at center, ${C.orange}44 0%, ${C.blueLight}22 40%, transparent 70%)`, borderRadius: '50%' }} />
                                {/* Rings */}
                                <div className="animate-rotate" style={{ position: 'absolute', inset: '-40px', border: `1px solid ${C.orange}40`, borderRadius: '50%' }} />
                                <div className="animate-rotate" style={{ position: 'absolute', inset: '-20px', border: `1px solid ${C.blueSky}20`, borderRadius: '50%', animationDirection: 'reverse', animationDuration: '12s' }} />
                                {/* Logo */}
                                <img
                                    src={LOGO_BASE64}
                                    alt="Solar Logo"
                                    style={{
                                        position: 'relative', zIndex: 10, width: '100%',
                                        filter: `drop-shadow(0 12px 60px ${C.orange}77) drop-shadow(0 0 80px ${C.blueLight}33)`,
                                        transition: 'all 0.5s ease-in-out',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'scale(1) translateY(0)';
                                    }}
                                />
                            </div>
                            <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.65rem', letterSpacing: '4px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>Tecnologia em Energia Renovável</p>
                        </div>

                        {/* Hero Text Section */}
                        <div className="order-2 md:order-1 flex flex-col text-center md:text-left">
                            {/* Badge */}
                            <div style={{ display: 'inline-flex', alignSelf: 'center', alignItems: 'center', gap: '8px', background: `${C.orange}18`, border: `1px solid ${C.orange}44`, color: C.orangeLight, padding: '6px 16px', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '24px' }} className="md:self-start">
                                <span style={{ width: '6px', height: '6px', background: C.orange, borderRadius: '50%', boxShadow: `0 0 8px ${C.orange}` }} className="animate-pulse" />
                                Excelência em Fotovoltaica
                            </div>

                            {/* Heading */}
                            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3.2rem, 10vw, 5.5rem)', lineHeight: 0.9, marginBottom: '24px' }}>
                                <span style={{ color: C.orange, display: 'block' }}>SOLAR</span>
                                <span style={{ color: '#FFFFFF' }}>SISTEMAS</span>
                            </h1>

                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(0.95rem, 3vw, 1.1rem)', lineHeight: 1.6, marginBottom: '32px', maxWidth: '480px' }} className="mx-auto md:mx-0">
                                A RVGS Elétrica traz para você o melhor da tecnologia solar. Reduza custos, aumente a sustentabilidade e garanta sua independência energética com quem é especialista.
                            </p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }} className="md:justify-start">
                                <button
                                    onClick={() => scrollToSection('contact')}
                                    style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`, color: '#fff', border: 'none', cursor: 'pointer', padding: '16px 32px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', boxShadow: `0 8px 24px ${C.orange}44`, flex: '1 1 auto', minWidth: 'min(100%, 200px)' }}
                                >Solicitar Estudo</button>
                                <button
                                    onClick={() => scrollToSection('solar')}
                                    style={{ background: 'transparent', color: '#FFFFFF', border: `1.5px solid rgba(255,255,255,0.2)`, cursor: 'pointer', padding: '16px 32px', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', flex: '1 1 auto', minWidth: 'min(100%, 200px)' }}
                                >Saiba Mais</button>
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'flex', gap: 'max(20px, 4vw)', marginTop: '48px', paddingTop: '32px', borderTop: `1px solid rgba(255,255,255,0.1)`, justifyContent: 'center' }} className="md:justify-start">
                                {[{ val: '+10', label: 'Anos' }, { val: '+500', label: 'Projetos' }, { val: '98%', label: 'Economia' }].map(stat => (
                                    <div key={stat.label} style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 700, color: C.orange, lineHeight: 1 }}>{stat.val}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '4px' }}>{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── SOLAR SECTION ── */}
            <div className="solar-section section-full" id="fotovoltaica">
                <div className="solar-hero-wrap lg:grid-cols-2" style={{ display: 'grid', gridTemplateColumns: '1fr', width: '100%' }}>
                    <div className="solar-left" style={{ padding: 'var(--section-py) var(--container-px)' }}>
                        <div className="section-tag">⚡ Destaque</div>
                        <h2 className="section-title" style={{ color: C.white }}>ELÉTRICA<br /><span style={{ color: C.orange }}>FOTOVOLTAICA</span></h2>
                        <p className="section-desc" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            Projete e instale sua usina solar com total segurança técnica. Atendemos desde residências até grandes empreendimentos.
                        </p>
                        <ul className="service-list">
                            {[
                                { icon: '🏭', title: 'Projeto de Micro Usina', desc: 'Dimensionamento completo e homologação.' },
                                { icon: '🔧', title: 'Instalação de Módulos', desc: 'Montagem profissional certificada.' },
                                { icon: '🚗', title: 'Wallbox Carros Elétricos', desc: 'Carregador integrado ao seu sistema solar.' }
                            ].map(s => (
                                <li key={s.title} className="service-item">
                                    <div className="service-icon">{s.icon}</div>
                                    <div className="service-text">
                                        <strong style={{ color: '#FFF' }}>{s.title}</strong>
                                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>{s.desc}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="solar-right" style={{ padding: 'var(--section-py) var(--container-px)' }}>
                        <div className="section-tag">📋 Por que solar?</div>
                        <h2 className="section-title" style={{ color: C.white }}>VANTAGENS<br /><span style={{ color: C.blueSky }}>DO SISTEMA</span></h2>
                        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {[
                                { icon: '💰', title: 'Retorno sobre investimento', desc: 'Média 3 a 5 anos, geração por 25+ anos.' },
                                { icon: '🌱', title: 'Sustentabilidade', desc: 'Energia limpa e renovável, zero CO₂.' },
                                { icon: '📈', title: 'Valorização do imóvel', desc: 'Imóveis valem até 8% mais.' },
                                { icon: '🔋', title: 'Independência energética', desc: 'Proteção contra aumentos tarifários.' }
                            ].map(v => (
                                <div key={v.title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                    <div style={{ fontSize: '2rem' }}>{v.icon}</div>
                                    <div>
                                        <strong style={{ display: 'block', marginBottom: 4, color: '#FFF' }}>{v.title}</strong>
                                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{v.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ backgroundColor: '#0f1520', color: '#FFFFFF' }}>
                <div style={{ height: '1px', background: `linear-gradient(to right, transparent, rgba(235,113,2,0.2), transparent)`, margin: '0 48px' }} />

                {/* ── ALL SERVICES ── */}
                <section id="services" className="responsive-container">
                    <div style={{ textAlign: 'center' }}>
                        <div className="section-tag">🛠 Soluções completas</div>
                        <h2 className="section-title">TODOS OS<br /><span style={{ color: C.orange }}>SERVIÇOS</span></h2>
                        <p className="section-desc" style={{ margin: '0 auto' }}>Do padrão de entrada à hidráulica, a RVGS entrega soluções completas para a sua obra ou residência.</p>
                    </div>

                    <div className="services-grid">
                        {/* Fotovoltaica */}
                        <div className="service-card solar-card">
                            <span className="card-icon">☀️</span>
                            <h3 className="card-title" style={{ color: 'var(--color-bg)' }}>Elétrica Fotovoltaica</h3>
                            <p className="card-desc">Sistemas de energia solar completos, do projeto à homologação.</p>
                            <ul className="card-items">
                                <li>Projeto de micro usina fotovoltaica</li>
                                <li>Instalação e montagem de módulos fotovoltaicos</li>
                                <li>Instalação de Wallbox para carros elétricos</li>
                            </ul>
                        </div>

                        {/* Elétrica Residencial */}
                        <div className="service-card">
                            <span className="card-icon">⚡</span>
                            <h3 className="card-title" style={{ color: 'var(--color-bg)' }}>Elétrica Residencial</h3>
                            <p className="card-desc">Instalações elétricas residenciais com segurança e qualidade.</p>
                            <ul className="card-items">
                                <li>Padrão de entrada Neoenergia / CAESB</li>
                                <li>Infraestrutura elétrica</li>
                                <li>Montagem de quadro de disjuntores</li>
                                <li>Interruptores, tomadas e luminárias</li>
                                <li>Instalação de perfil de LEDs</li>
                            </ul>
                        </div>

                        {/* Hidráulica */}
                        <div className="service-card">
                            <span className="card-icon">💧</span>
                            <h3 className="card-title" style={{ color: 'var(--color-bg)' }}>Hidráulica</h3>
                            <p className="card-desc">Soluções completas em água fria, quente e pluvial.</p>
                            <ul className="card-items">
                                <li>Instalações de água fria</li>
                                <li>Instalações de água quente</li>
                                <li>Sistemas pluviais e drenagem</li>
                                <li>Manutenção e reparo hidráulico</li>
                            </ul>
                        </div>

                        {/* Validação e Burocracia */}
                        <div className="service-card burocracia-card">
                            <span className="card-icon">📋</span>
                            <h3 className="card-title">Validação e Burocracia</h3>
                            <p className="card-desc">Cuidamos de toda a papelada e validações técnicas para garantir segurança jurídica e operacional.</p>
                            <ul className="card-items">
                                <li>Visita Técnica Presencial</li>
                                <li>Assinatura de Contrato</li>
                                <li>Entrada de Projeto na Concessionária</li>
                                <li>ART / RRT de responsabilidade técnica</li>
                                <li>Homologação junto à Neoenergia / CAESB</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <div style={{ height: '1px', background: `linear-gradient(to right, transparent, rgba(235,113,2,0.2), transparent)`, margin: '0 48px' }} />

                {/* ── WHY US ── */}
                <section id="why" className="responsive-container">
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <div className="section-tag">🏆 Diferenciais</div>
                        <h2 className="section-title">POR QUE<br /><span style={{ color: C.orange }}>A RVGS?</span></h2>
                        <p className="section-desc" style={{ margin: '0 auto' }}>Excelência técnica e compromisso com o seu investimento em cada etapa do projeto.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                        {[
                            { icon: '📐', title: 'Projeto Técnico', desc: 'Projetos elaborados por profissionais habilitados com ART/RRT.' },
                            { icon: '✅', title: 'Homologação Garantida', desc: 'Processo completo junto à Neoenergia e CAESB, sem dor de cabeça.' },
                            { icon: '🛡️', title: 'Garantia nos Serviços', desc: 'Todos os serviços com garantia documentada e assistência técnica.' },
                            { icon: '📍', title: 'Atendimento Local', desc: 'Equipe em Brasília/DF com rápido tempo de resposta e atendimento personalizado.' }
                        ].map(card => (
                            <div key={card.title} className="glass-card" style={{ padding: '32px', borderRadius: '16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{card.icon}</div>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', color: C.navy }}>{card.title}</h3>
                                <p style={{ fontSize: '0.9rem', color: C.muted, lineHeight: 1.6 }}>{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <div style={{ height: '1px', background: `linear-gradient(to right, transparent, rgba(235,113,2,0.2), transparent)`, margin: '0 48px' }} />

                {/* ── CTA / QUOTE FORM ── */}
                <div className="cta-section section-full" id="contact" style={{ background: '#0d1422' }}>
                    <div className="responsive-container">
                        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                            <div className="section-tag">☀️ Orçamento Gratuito</div>
                            <h2 className="section-title" style={{ color: '#FFF' }}>SOLICITE SEU<br /><span style={{ color: C.orange }}>ESTUDO SOLAR</span></h2>
                            <p className="section-desc" style={{ margin: '0 auto', color: 'rgba(255,255,255,0.7)' }}>Preencha abaixo e receba um estudo personalizado. Respondemos rapidamente!</p>
                        </div>

                        {quoteSubmitted ? (
                            <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '48px 32px', borderRadius: '24px' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
                                <h3 style={{ color: C.orange, fontFamily: 'var(--font-display)', fontSize: '1.8rem', marginBottom: '12px' }}>Solicitação Enviada!</h3>
                                <p style={{ color: '#FFF', opacity: 0.8, lineHeight: 1.7 }}>
                                    Abrimos o WhatsApp com sua mensagem. Nossa equipe vai entrar em contato em breve com seu estudo solar gratuito!
                                </p>
                                <button
                                    onClick={() => setQuoteSubmitted(false)}
                                    style={{ marginTop: '24px', background: 'none', border: `1px solid ${C.orange}44`, color: C.orange, padding: '12px 32px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 }}
                                >
                                    Enviar outra solicitação
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleQuoteSubmit} className="glass-card" style={{
                                maxWidth: '700px', margin: '0 auto',
                                padding: 'clamp(24px, 5vw, 48px)',
                                borderRadius: '24px',
                                background: 'rgba(255,255,255,0.03)',
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }} className="md:grid-cols-2">
                                    {/* Nome */}
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                                            Nome completo *
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={quoteForm.name}
                                            onChange={e => setQuoteForm({ ...quoteForm, name: e.target.value })}
                                            placeholder="Seu nome"
                                            style={{
                                                width: '100%', boxSizing: 'border-box',
                                                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                                                borderRadius: '10px', padding: '12px 16px', color: '#fff',
                                                fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s',
                                            }}
                                            onFocus={e => e.target.style.borderColor = C.orange}
                                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                                        />
                                    </div>
                                    {/* Telefone */}
                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                                            WhatsApp *
                                        </label>
                                        <input
                                            required
                                            type="tel"
                                            value={quoteForm.phone}
                                            onChange={e => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                                            placeholder="(61) 9 9999-9999"
                                            style={{
                                                width: '100%', boxSizing: 'border-box',
                                                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                                                borderRadius: '10px', padding: '12px 16px', color: '#fff',
                                                fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s',
                                            }}
                                            onFocus={e => e.target.style.borderColor = C.orange}
                                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                                        />
                                    </div>
                                    {/* Cidade */}
                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                                            Cidade / Bairro *
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={quoteForm.city}
                                            onChange={e => setQuoteForm({ ...quoteForm, city: e.target.value })}
                                            placeholder="Ex: Brasília, Gama..."
                                            style={{
                                                width: '100%', boxSizing: 'border-box',
                                                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                                                borderRadius: '10px', padding: '12px 16px', color: '#fff',
                                                fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s',
                                            }}
                                            onFocus={e => e.target.style.borderColor = C.orange}
                                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                                        />
                                    </div>
                                    {/* Tipo de imóvel */}
                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                                            Tipo de imóvel
                                        </label>
                                        <select
                                            value={quoteForm.property_type}
                                            onChange={e => setQuoteForm({ ...quoteForm, property_type: e.target.value })}
                                            style={{
                                                width: '100%', boxSizing: 'border-box',
                                                background: 'rgba(30,30,50,0.9)', border: '1px solid rgba(255,255,255,0.12)',
                                                borderRadius: '10px', padding: '12px 16px', color: '#fff',
                                                fontSize: '0.95rem', outline: 'none',
                                            }}
                                        >
                                            <option value="Residencial">🏠 Residencial</option>
                                            <option value="Comercial">🏢 Comercial</option>
                                            <option value="Rural">🌾 Rural / Agronegócio</option>
                                            <option value="Industrial">🏭 Industrial</option>
                                        </select>
                                    </div>
                                    {/* Valor da conta */}
                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                                            Valor médio da conta (R$)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={quoteForm.bill_value}
                                            onChange={e => setQuoteForm({ ...quoteForm, bill_value: e.target.value })}
                                            placeholder="Ex: 350"
                                            style={{
                                                width: '100%', boxSizing: 'border-box',
                                                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                                                borderRadius: '10px', padding: '12px 16px', color: '#fff',
                                                fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s',
                                            }}
                                            onFocus={e => e.target.style.borderColor = C.orange}
                                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                                        />
                                    </div>
                                    {/* Tipo de telhado */}
                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                                            Tipo de telhado
                                        </label>
                                        <select
                                            value={quoteForm.roof_type}
                                            onChange={e => setQuoteForm({ ...quoteForm, roof_type: e.target.value })}
                                            style={{
                                                width: '100%', boxSizing: 'border-box',
                                                background: 'rgba(30,30,50,0.9)', border: '1px solid rgba(255,255,255,0.12)',
                                                borderRadius: '10px', padding: '12px 16px', color: '#fff',
                                                fontSize: '0.95rem', outline: 'none',
                                            }}
                                        >
                                            <option value="Cerâmica">🏺 Cerâmica</option>
                                            <option value="Metálico">🔧 Metálico</option>
                                            <option value="Laje">🏗️ Laje</option>
                                            <option value="Solo">🌱 Solo (ground mount)</option>
                                            <option value="Fibrocimento">🏠 Fibrocimento</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={quoteSubmitting}
                                    style={{
                                        marginTop: '28px', width: '100%',
                                        background: quoteSubmitting ? `${C.orange}88` : `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
                                        color: '#fff', border: 'none', cursor: quoteSubmitting ? 'not-allowed' : 'pointer',
                                        padding: '16px 32px', borderRadius: '12px',
                                        fontWeight: 700, fontSize: '1rem', letterSpacing: '1px',
                                        boxShadow: `0 8px 24px ${C.orange}44`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {quoteSubmitting ? (
                                        <>⏳ Enviando...</>
                                    ) : (
                                        <>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                            Quero Meu Estudo Gratuito via WhatsApp
                                        </>
                                    )}
                                </button>
                                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '12px' }}>
                                    🔒 Seus dados são usados apenas para elaborar seu orçamento. Não fazemos spam.
                                </p>
                            </form>
                        )}

                        <div className="contact-cards" style={{ marginTop: '48px' }}>
                            <div className="contact-card">
                                <div className="icon">📱</div>
                                <div className="label">WhatsApp</div>
                                <div className="value">(61) 99380-1434</div>
                            </div>
                            <div className="contact-card">
                                <div className="icon">📍</div>
                                <div className="label">Área de atuação</div>
                                <div className="value">Brasília / DF</div>
                            </div>
                            <div className="contact-card">
                                <div className="icon">🏢</div>
                                <div className="label">CNPJ</div>
                                <div className="value">64.976.735/0001-38</div>
                            </div>
                        </div>
                    </div>
                </div> {/* END OF DARK WRAPPER */}


                {/* ── FOOTER ── */}
                <footer style={{ background: '#0f1520', padding: '40px var(--container-px)', borderTop: `1px solid ${C.blue}30`, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                        <img src={LOGO_BASE64} alt="RVGS Footer" style={{ height: '52px', width: 'auto', filter: 'brightness(10)', opacity: 0.9 }} />
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: 0 }}>© 2024 RVGS Elétrica. Todos os direitos reservados.</p>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <p style={{ margin: 0 }}>Brasília - Distrito Federal</p>
                        <p style={{ margin: 0, opacity: 0.5 }}>CNPJ: 64.976.735/0001-38</p>
                        <Link to="/admin/login" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none', marginTop: '12px', fontSize: '0.75rem', transition: 'color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = C.orange}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>admin_panel_settings</span>
                            Acesso Restrito
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Landing;