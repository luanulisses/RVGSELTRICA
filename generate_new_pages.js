const fs = require('fs');
const path = require('path');

const seoPagesPath = path.join(__dirname, 'supabase', 'seo_pages.json');
const sitemapPath = path.join(__dirname, 'public', 'sitemap.xml');

const pagesData = [
  {
    slug: "eletricista-urgente-brasilia",
    service: "Eletricista Urgente",
    title: "Eletricista Urgente em Brasília 24h | Atendimento Rápido DF",
    meta: "Precisa de eletricista urgente em Brasília? Atendimento rápido 24h para emergências elétricas residenciais e comerciais no DF.",
    keywords: "eletricista urgente brasília, eletricista 24h df, emergência elétrica df"
  },
  {
    slug: "manutencao-eletrica-residencial-brasilia",
    service: "Manutenção Elétrica Residencial",
    title: "Manutenção Elétrica Residencial em Brasília | Segurança e Qualidade",
    meta: "Serviços de manutenção elétrica residencial em Brasília com profissionais qualificados. Evite riscos e garanta segurança.",
    keywords: "manutenção elétrica residencial brasília, reparo elétrico df, eletricista manutenção df"
  },
  {
    slug: "troca-de-disjuntor-brasilia",
    service: "Troca de Disjuntor",
    title: "Troca de Disjuntor em Brasília | Serviço Rápido e Seguro",
    meta: "Troca de disjuntor em Brasília com técnicos especializados. Atendimento rápido e seguro para sua residência ou empresa.",
    keywords: "troca de disjuntor brasília, disjuntor desarmando df, conserto quadro elétrico df"
  },
  {
    slug: "instalacao-chuveiro-eletrico-brasilia",
    service: "Instalação de Chuveiro Elétrico",
    title: "Instalação de Chuveiro Elétrico em Brasília | Profissional Especializado",
    meta: "Instalação de chuveiro elétrico com segurança em Brasília. Evite riscos com instalação profissional.",
    keywords: "instalação de chuveiro elétrico brasília, instalar chuveiro df, eletricista chuveiro df"
  },
  {
    slug: "quadro-eletrico-residencial-brasilia",
    service: "Quadro Elétrico Residencial",
    title: "Quadro Elétrico Residencial em Brasília | Montagem e Manutenção",
    meta: "Montagem e manutenção de quadro elétrico residencial em Brasília. Organização, segurança e eficiência elétrica.",
    keywords: "quadro elétrico residencial brasília, montagem qdc df, manutenção quadro de luz df"
  },
  {
    slug: "padrao-energia-brasilia",
    service: "Instalação de Padrão de Energia",
    title: "Instalação de Padrão de Energia em Brasília | Regularização Completa",
    meta: "Regularize seu padrão de energia em Brasília com profissionais especializados. Atendemos normas e exigências.",
    keywords: "padrão de energia brasília, instalação relógio neoenergia df, eletricista padrão de luz df"
  },
  {
    slug: "energia-solar-residencial-brasilia",
    service: "Energia Solar Residencial",
    title: "Energia Solar Residencial em Brasília | Economia na Conta de Luz",
    meta: "Instalação de energia solar residencial em Brasília. Reduza sua conta de luz e invista em energia limpa.",
    keywords: "energia solar residencial brasília, painel solar para casas df, sistema fotovoltaico residencial df"
  },
  {
    slug: "eletricista-comercial-brasilia",
    service: "Eletricista Comercial",
    title: "Eletricista Comercial em Brasília | Soluções para Empresas",
    meta: "Serviços elétricos para empresas em Brasília. Instalação, manutenção e suporte técnico especializado.",
    keywords: "eletricista comercial brasília, manutenção elétrica predial df, eletricista para empresas df"
  },
  {
    slug: "curto-circuito-brasilia",
    service: "Correção de Curto Circuito",
    title: "Curto Circuito em Brasília | Diagnóstico e Solução Rápida",
    meta: "Resolveu curto circuito em Brasília? Atendimento rápido para identificar e corrigir problemas elétricos.",
    keywords: "curto circuito brasília, consertar curto circuito df, cheiro de queimado tomada df"
  },
  {
    slug: "instalacao-iluminacao-brasilia",
    service: "Instalação de Iluminação",
    title: "Instalação de Iluminação em Brasília | Projetos Residenciais e Comerciais",
    meta: "Instalação de iluminação em Brasília com qualidade e eficiência. Projetos modernos e econômicos.",
    keywords: "instalação de iluminação brasília, projeto luminotécnico df, instalação led sanca df"
  }
];

const generateHtml = (title, service) => {
  return `<div class="seo-page-content">
  <h1>${title} - Serviço Profissional</h1>
  <p>Se você procura um especialista em <strong>${service} em Brasília</strong>, a RVGS Elétrica oferece serviços completos com qualidade, segurança e rapidez. Atendemos residências, comércios e indústrias em todo o Distrito Federal.</p>
  
  <h2>Por que contratar um profissional para ${service}?</h2>
  <p>Problemas elétricos podem causar riscos graves, como incêndios e choques elétricos. Por isso, contar com um profissional qualificado é essencial para garantir segurança e eficiência na sua instalação elétrica.</p>
  
  <h2>Nossos serviços</h2>
  <ul>
    <li>Instalação elétrica completa</li>
    <li>Manutenção elétrica preventiva</li>
    <li>Troca de disjuntores</li>
    <li>Instalação de chuveiros</li>
    <li>Correção de curto circuito</li>
    <li>Projetos luminotécnicos</li>
  </ul>
  
  <h2>Atendimento em Brasília e região</h2>
  <p>Atendemos todas as regiões do DF com rapidez e eficiência. Chegamos rápido em emergências.</p>
  
  <h2>Perguntas Frequentes sobre ${service}</h2>
  <div class="faq-section">
    <h3>Quanto custa o serviço de ${service} em Brasília?</h3>
    <p>O valor varia conforme o escopo do projeto e os materiais necessários. Solicite um orçamento sem compromisso e enviaremos um técnico especializado para avaliação.</p>
    
    <h3>Vocês atendem emergências 24h?</h3>
    <p>Sim, oferecemos atendimento rápido para urgências elétricas em todo o Distrito Federal, priorizando a segurança da sua família e do seu patrimônio.</p>
  </div>
  
  <div class="cta-banner">
    <h3>Solicite um orçamento agora</h3>
    <p>Fale direto com a nossa equipe técnica pelo WhatsApp e agende o seu serviço.</p>
    <a href="https://wa.me/5561993801434?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20${encodeURIComponent(service)}%20em%20Bras%C3%ADlia" target="_blank" class="btn-cta-whatsapp">Falar no WhatsApp</a>
  </div>
</div>`;
};

// Update JSON file
let currentJson = JSON.parse(fs.readFileSync(seoPagesPath, 'utf-8'));

let sqlStatements = [];

pagesData.forEach(page => {
  const html = generateHtml(page.title, page.service);
  
  // push to JSON
  currentJson.push({
    slug: page.slug,
    title: page.title,
    meta_description: page.meta,
    keywords: page.keywords,
    content_html: html
  });

  // generate SQL snippet
  sqlStatements.push(`(
  '${page.slug}',
  '${page.title}',
  '${page.meta}',
  '${page.keywords}',
  $$${html}$$
)`);
});

fs.writeFileSync(seoPagesPath, JSON.stringify(currentJson, null, 2), 'utf-8');

const finalSql = `INSERT INTO seo_pages (slug, title, meta_description, keywords, content_html) \nVALUES \n${sqlStatements.join(',\n')};`;
fs.writeFileSync(path.join(__dirname, 'supabase', 'insert_10_pages.sql'), finalSql, 'utf-8');



console.log('Successfully generated JSON, SQL, and updated Sitemap.');
