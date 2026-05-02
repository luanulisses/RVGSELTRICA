import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminhos dos arquivos
const jsonPath = path.join(__dirname, 'supabase', 'seo_pages.json');
const indexHtmlPath = path.join(__dirname, 'dist', 'index.html');
const publicDir = path.join(__dirname, 'dist', 'servicos');

// Lê os dados do JSON
const seoPagesRaw = fs.readFileSync(jsonPath, 'utf-8');
const seoPages = JSON.parse(seoPagesRaw);

// Lê o template do index.html da raiz
const templateHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

// Garante que o diretório base existe
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

seoPages.forEach(page => {
    const slugDir = path.join(publicDir, page.slug);
    if (!fs.existsSync(slugDir)) {
        fs.mkdirSync(slugDir, { recursive: true });
    }

    // Função auxiliar para gerar Schema.org JSON-LD
    const generateSchema = (data) => {
        return JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "LocalBusiness",
                    "name": "RVGS Elétrica",
                    "image": "https://rvgseletrica.com.br/icon-192.png",
                    "url": "https://rvgseletrica.com.br",
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
        });
    };

    let modifiedHtml = templateHtml;

    // Substitui a Title tag
    modifiedHtml = modifiedHtml.replace(
        /<title>.*?<\/title>/,
        `<title>${page.title}</title>`
    );

    // Substitui Meta Description
    modifiedHtml = modifiedHtml.replace(
        /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
        `<meta name="description" content="${page.meta_description}" />`
    );

    // Substitui Meta Keywords
    modifiedHtml = modifiedHtml.replace(
        /<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/,
        `<meta name="keywords" content="${page.keywords}" />`
    );

    // Injeta Open Graph customizado
    modifiedHtml = modifiedHtml.replace(
        /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:title" content="${page.title}" />`
    );
    modifiedHtml = modifiedHtml.replace(
        /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:description" content="${page.meta_description}" />`
    );
    modifiedHtml = modifiedHtml.replace(
        /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:url" content="https://rvgseletrica.com.br/servicos/${page.slug}" />`
    );

    // Injeta Canonical Tag
    const canonicalTag = `<link rel="canonical" href="https://rvgseletrica.com.br/servicos/${page.slug}" />\n</head>`;
    modifiedHtml = modifiedHtml.replace('</head>', canonicalTag);

    // Injeta JSON-LD
    const jsonLdScript = `<script type="application/ld+json">\n${generateSchema(page)}\n</script>\n</head>`;
    modifiedHtml = modifiedHtml.replace('</head>', jsonLdScript);

    // Injeta o conteúdo HTML dentro da div root para leitura Imediata do Googlebot (Poor Man's SSR)
    // O React createRoot vai sobrescrever isso assim que carregar, mas o bot já vai ter lido!
    const rootInjection = `<div id="root">\n  <!-- SSR Content for Googlebot -->\n  <div style="padding: 20px; font-family: sans-serif;">\n    <h1>${page.title}</h1>\n    ${page.content_html}\n  </div>\n</div>`;
    modifiedHtml = modifiedHtml.replace('<div id="root"></div>', rootInjection);

    // Salva o index.html na pasta estática
    const outputPath = path.join(slugDir, 'index.html');
    fs.writeFileSync(outputPath, modifiedHtml, 'utf-8');
    console.log(`Gerado SSG para: ${page.slug} -> ${outputPath}`);
});

console.log('Pré-renderização estática SEO concluída com sucesso!');
