import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LOGO_BASE64 } from '../constants/assets';

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

interface SeoPageData {
    id?: number;
    slug: string;
    title: string;
    meta_description: string;
    keywords: string;
    content_html: string;
}

const ServicePage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [pageData, setPageData] = useState<SeoPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPage = async () => {
            try {
                setLoading(true);
                // Busca a página no Supabase pelo slug
                const { data, error } = await supabase
                    .from('seo_pages')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (error) {
                    throw error;
                }

                if (data) {
                    setPageData(data);
                    // Atualiza Meta Tags dinamicamente
                    document.title = data.title;
                    
                    let metaDesc = document.querySelector('meta[name="description"]');
                    if (metaDesc) {
                        metaDesc.setAttribute('content', data.meta_description);
                    } else {
                        metaDesc = document.createElement('meta');
                        metaDesc.setAttribute('name', 'description');
                        metaDesc.setAttribute('content', data.meta_description);
                        document.head.appendChild(metaDesc);
                    }

                    let metaKeywords = document.querySelector('meta[name="keywords"]');
                    if (metaKeywords) {
                        metaKeywords.setAttribute('content', data.keywords);
                    } else {
                        metaKeywords = document.createElement('meta');
                        metaKeywords.setAttribute('name', 'keywords');
                        metaKeywords.setAttribute('content', data.keywords);
                        document.head.appendChild(metaKeywords);
                    }
                }
            } catch (err: any) {
                console.error("Erro ao buscar página SEO:", err);
                setError('Página não encontrada.');
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchPage();
        }
    }, [slug]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: C.bg, color: C.navy }}>
                <h2>Carregando...</h2>
            </div>
        );
    }

    if (error || !pageData) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: C.bg, color: C.navy }}>
                <h2>Página não encontrada</h2>
                <Link to="/" style={{ marginTop: '20px', color: C.orange, textDecoration: 'none', fontWeight: 'bold' }}>Voltar para a Home</Link>
            </div>
        );
    }

    const generateSchema = (data: SeoPageData) => {
        const schema = {
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "LocalBusiness",
                    "name": "RVGS Elétrica",
                    "image": "https://www.rvgseletricafotovoltaica.com/icon-192.png",
                    "url": "https://www.rvgseletricafotovoltaica.com",
                    "telephone": "+5561993801434",
                    "address": {
                        "@type": "PostalAddress",
                        "addressLocality": "Brasília",
                        "addressRegion": "DF",
                        "addressCountry": "BR"
                    }
                },
                {
                    "@type": "Service",
                    "serviceType": data.title.split('|')[0].trim(),
                    "provider": {
                        "@type": "LocalBusiness",
                        "name": "RVGS Elétrica"
                    },
                    "areaServed": {
                        "@type": "State",
                        "name": "Distrito Federal"
                    },
                    "description": data.meta_description
                },
                {
                    "@type": "FAQPage",
                    "mainEntity": data.slug === 'energia-solar-brasilia' ? [
                        {
                            "@type": "Question",
                            "name": "Quanto tempo demora a instalação de um sistema de energia solar em Brasília?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "A instalação física dos painéis geralmente leva de 1 a 3 dias úteis. No entanto, o processo burocrático completo pode levar de 30 a 45 dias no total."
                            }
                        },
                        {
                            "@type": "Question",
                            "name": "O sistema de energia solar funciona em dias nublados ou chuvosos?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "Sim! Os painéis solares captam a radiação solar (luminosidade), não necessariamente o calor. Em dias nublados a eficiência é reduzida, mas a geração de energia não para."
                            }
                        }
                    ] : data.slug === 'eletricista-residencial-brasilia' ? [
                        {
                            "@type": "Question",
                            "name": "A RVGS Elétrica atende condomínios residenciais e estabelecimentos comerciais no DF?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "Sim. Oferecemos pacotes especializados de manutenção elétrica preditiva, preventiva e corretiva para prédios comerciais, condomínios residenciais e lojas."
                            }
                        },
                        {
                            "@type": "Question",
                            "name": "Qual é a garantia oferecida para o serviço do eletricista da RVGS?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "Nossos serviços de instalação elétrica DF acompanham garantia de mão de obra que varia de 90 dias a 1 ano inteiro, além da emissão de nota fiscal."
                            }
                        }
                    ] : []
                }
            ]
        };
        return JSON.stringify(schema);
    };

    return (
        <div style={{ fontFamily: 'var(--font-body)', background: C.bg, color: C.body, minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>
            {/* Inject JSON-LD */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: generateSchema(pageData) }} />
            
            {/* ── NAV (Simplificada para páginas internas) ── */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px var(--container-px)',
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(16px)',
                borderBottom: `1px solid ${C.orange}33`,
                boxShadow: '0 2px 16px rgba(21,101,192,0.08)',
            }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                    <img src={LOGO_BASE64} alt="RVGS Logo" style={{ height: 'clamp(40px, 10vw, 56px)', width: 'auto' }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 700, letterSpacing: '1px' }}>
                        <span style={{ color: C.orange }}>RVGS </span>
                        <span style={{ color: C.navy }}>ELÉTRICA</span>
                    </span>
                </Link>
                <Link to="/#contact" style={{ background: C.orange, color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', boxShadow: `0 4px 16px ${C.orange}44` }}>
                    Orçamento
                </Link>
            </nav>

            {/* ── HEADER DE SERVIÇO ── */}
            <header style={{ 
                background: `linear-gradient(135deg, #0d1422 0%, #111c2d 100%)`, 
                padding: '160px 24px 80px', 
                textAlign: 'center',
                color: '#FFF'
            }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', maxWidth: '900px', margin: '0 auto', lineHeight: 1.2 }}>
                    {pageData.title}
                </h1>
            </header>

            {/* ── CONTEÚDO DINÂMICO SEO ── */}
            <main style={{ padding: '60px var(--container-px)', maxWidth: '900px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                <div 
                    className="seo-dynamic-content"
                    dangerouslySetInnerHTML={{ __html: pageData.content_html }} 
                    style={{ 
                        lineHeight: 1.8, 
                        fontSize: '1.1rem',
                        color: C.body 
                    }}
                />
            </main>

            {/* ── FOOTER ── */}
            <footer style={{ background: '#0f1520', padding: '40px var(--container-px)', borderTop: `1px solid ${C.blue}30`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: '#FFF' }}>
                <img src={LOGO_BASE64} alt="RVGS Footer" style={{ height: '52px', filter: 'brightness(10)', opacity: 0.9 }} />
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', textAlign: 'center' }}>
                    © 2024 RVGS Elétrica. Todos os direitos reservados. <br/>
                    Brasília - Distrito Federal | CNPJ: 64.976.735/0001-38
                </p>
            </footer>

            {/* Estilos injetados para o conteúdo HTML dinâmico */}
            <style>{`
                .seo-dynamic-content h2 {
                    color: ${C.navy};
                    font-size: 2rem;
                    margin-top: 40px;
                    margin-bottom: 20px;
                }
                .seo-dynamic-content h3 {
                    color: ${C.orange};
                    font-size: 1.5rem;
                    margin-top: 30px;
                    margin-bottom: 15px;
                }
                .seo-dynamic-content p {
                    margin-bottom: 20px;
                }
                .seo-dynamic-content ul {
                    margin-bottom: 20px;
                    padding-left: 20px;
                }
                .seo-dynamic-content li {
                    margin-bottom: 10px;
                }
                .seo-dynamic-content strong {
                    color: ${C.navy};
                }
                .faq-section {
                    background: ${C.white};
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                    margin-top: 40px;
                }
                .cta-banner {
                    background: linear-gradient(135deg, ${C.orange}, ${C.orangeLight});
                    padding: 40px;
                    border-radius: 16px;
                    text-align: center;
                    color: #fff;
                    margin: 40px 0;
                    box-shadow: 0 8px 30px rgba(245, 160, 0, 0.3);
                }
                .cta-banner h3 {
                    color: #fff !important;
                    margin-top: 0 !important;
                    font-size: 1.8rem !important;
                }
                .cta-banner p {
                    font-size: 1.1rem;
                    opacity: 0.9;
                }
                .btn-cta-whatsapp {
                    display: inline-block;
                    margin-top: 20px;
                    padding: 16px 32px;
                    background: #fff;
                    color: ${C.orange};
                    text-decoration: none;
                    font-weight: bold;
                    border-radius: 8px;
                    font-size: 1.1rem;
                    transition: transform 0.2s;
                }
                .btn-cta-whatsapp:hover {
                    transform: translateY(-3px);
                }
            `}</style>
        </div>
    );
};

export default ServicePage;
