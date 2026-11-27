import { useState } from 'react';

const stalls = {
  technologies: {
    title: 'Ferramentas da jornada', intro: 'Escolha uma área para conhecer as tecnologias do currículo.',
    options: [
      ['Front-end', 'React, Next.js, JavaScript (ES6+), TypeScript, Redux, HTML5, CSS3, Sass, Bootstrap e Tailwind CSS.'],
      ['Back-end e APIs', 'Node.js, Laravel, Java Web e AdvPL. Implementação e integração de APIs REST em aplicações web e no ERP Protheus.'],
      ['Dados', 'Modelagem, criação e manutenção de bancos PostgreSQL. Experiência também com MySQL, MongoDB e Firebase.'],
      ['Qualidade e ferramentas', 'Jest e Playwright para testes, Git e GitHub para versionamento, Linux e VS Code no ambiente de desenvolvimento e Scrum na organização do trabalho.'],
      ['Agentes e IA local', 'Uso Codex, Google Antigravity, GitHub Copilot e OpenCode no desenvolvimento. Também trabalho com IA generativa e engenharia de prompts e uso Ollama para executar modelos de linguagem localmente, como no Chat IA Local e no Órbita.'],
    ],
  },
  experience: {
    title: 'Jornada profissional', intro: 'Escolha uma experiência para conhecer o trabalho realizado.',
    options: [
      ['FUNCAP', 'Bolsista de desenvolvimento front-end (08/2021 a 04/2026). Participei do desenvolvimento da Vitrine Funcap, voltada à divulgação de dados e iniciativas de inovação, e da Plataforma Montenegro, portal de oportunidades, editais e resultados de fomento. Trabalhei com React, Next.js e Laravel. Criei e mantive bases PostgreSQL, apliquei IA generativa em soluções da Funcap e participei da manutenção, do atendimento e da disponibilização de aplicações em rede.'],
      ['TOTVS', 'Estágio em desenvolvimento full-stack (06/2022 a 05/2023). Desenvolvi e mantive soluções para o ERP Protheus em AdvPL e aplicações web com JavaScript, Node.js e React. Implementei e integrei APIs REST para soluções corporativas.'],
      ['Núcleo de Soluções de Software — UFC', 'Estágio em desenvolvimento full-stack (05/2021 a 09/2021). Analisei requisitos e mantive o DARWIN, sistema de seleções e competições usado em processos de bolsas do campus de Russas, como PIBI, PAIP e PID. Trabalhei com Java e HTML5 em uma equipe que adotava Scrum.'],
      ['Chronos-UFC', 'Bolsista de desenvolvimento full-stack na UFC (04/2021 a 01/2022). Trabalhei com React, Node.js e PostgreSQL em um sistema para registrar atividades complementares, anexar comprovantes, acompanhar a avaliação e consultar as horas validadas.'],
    ],
  },
  education: {
    title: 'Formação e aprendizado', intro: 'Escolha uma etapa para conhecer a formação e os cursos.',
    options: [
      ['Engenharia de Software', 'Bacharelado na Universidade Federal do Ceará, campus de Russas (2018 a 2023). A formação abrange fundamentos de programação, estruturas de dados e o ciclo de desenvolvimento de software, desde a análise de requisitos e o desenho da arquitetura até implementação, testes, manutenção e gestão de projetos.'],
      ['Administração', 'Curso técnico na EEEP Leopoldina Gonçalves Quezado (2015 a 2017). Estuda como as organizações planejam e executam suas rotinas, com fundamentos de gestão de pessoas, finanças, logística, marketing e organização de processos administrativos.'],
      ['Google UX Design', 'Certificado profissional em andamento. O programa aborda pesquisa com usuários, definição de problemas e ideação de soluções. Inclui wireframes e protótipos de baixa e alta fidelidade no Figma, estudos de usabilidade e revisão de interfaces a partir do feedback.'],
      ['Impulso FullStack Developer', 'Bootcamp da DIO e da Impulso com desafios de código e projetos práticos. Estuda JavaScript e React no front-end, PostgreSQL para trabalhar com dados relacionais, e Ruby e Ruby on Rails no back-end. Também inclui testes de interfaces com Jest, React Testing Library e Cypress.'],
    ],
  },
};

const englishStalls = {
  technologies: { title: 'Tools of the journey', intro: 'Choose an area to explore the technologies in my resume.', options: [
    ['Front-end', 'React, Next.js, JavaScript (ES6+), TypeScript, Redux, HTML5, CSS3, Sass, Bootstrap and Tailwind CSS.'],
    ['Back-end and APIs', 'Node.js, Laravel, Java web development and AdvPL. Built and integrated REST APIs for web applications and the Protheus ERP.'],
    ['Data', 'PostgreSQL database modeling, creation and maintenance. Also experienced with MySQL, MongoDB and Firebase.'],
    ['Quality and tools', 'Jest and Playwright for testing, Git and GitHub for version control, Linux and VS Code for development, and Scrum for organizing team work.'],
    ['Agents and local AI', 'I use Codex, Google Antigravity, GitHub Copilot and OpenCode for development. I also work with generative AI and prompt engineering and use Ollama to run language models locally, including in Chat IA Local and Órbita.'],
  ] },
  experience: { title: 'Professional journey', intro: 'Choose a role to learn about my work.', options: [
    ['FUNCAP', 'Front-end development fellow (08/2021 to 04/2026). I contributed to the Funcap Showcase, which highlights innovation data and initiatives, and to Plataforma Montenegro, the portal for funding opportunities, calls for proposals and results. I worked with React, Next.js and Laravel. I created and maintained PostgreSQL databases, applied generative AI and helped maintain, support and deploy applications to a network environment.'],
    ['TOTVS', 'Full-stack development intern (06/2022 to 05/2023). I built and maintained Protheus ERP features in AdvPL and web applications with JavaScript, Node.js and React. I implemented and integrated REST APIs for internal business systems.'],
    ['Software Solutions Center — UFC', 'Full-stack development intern (05/2021 to 09/2021). I analyzed requirements and maintained DARWIN, a system for managing selections and competitions used by scholarship programs such as PIBI, PAIP and PID at the Russas campus. I worked with Java and HTML5 on a Scrum team.'],
    ['Chronos-UFC', 'Full-stack development fellow at UFC (04/2021 to 01/2022). I worked with React, Node.js and PostgreSQL on a system for submitting extracurricular activities, attaching supporting documents, tracking reviews and checking approved hours.'],
  ] },
  education: { title: 'Education and learning', intro: 'Choose a topic to learn about my education and courses.', options: [
    ['Software Engineering', 'Bachelor’s degree at the Federal University of Ceará, Russas campus (2018 to 2023). The program covers programming fundamentals, data structures and the software development lifecycle, from requirements and architecture through implementation, testing, maintenance and project management.'],
    ['Business Administration', 'Technical qualification at EEEP Leopoldina Gonçalves Quezado (2015 to 2017). The program explores how organizations plan and carry out their day-to-day operations, covering people management, finance, logistics, marketing and administrative processes.'],
    ['Google UX Design', 'Professional certificate in progress. The program covers user research, problem definition and ideation. It includes low- and high-fidelity wireframes and prototypes in Figma, usability studies and refining interfaces based on feedback.'],
    ['Impulso FullStack Developer', 'Bootcamp by DIO and Impulso with coding challenges and practical projects. It covers JavaScript and React for front-end development, PostgreSQL for relational data, and Ruby and Ruby on Rails for back-end development. It also includes interface testing with Jest, React Testing Library and Cypress.'],
  ] },
};

export function getMarketStall(type, language) {
  return (language === 'en-US' ? englishStalls : stalls)[type];
}

export function MarketStall({ type, language = 'pt-BR' }) {
  const stall = getMarketStall(type, language);
  const [selected, setSelected] = useState(null);
  return <section className="story market-content">
    <h3>{stall.title}</h3><p>{stall.intro}</p>
    <div className="market-options" role="group" aria-label={stall.title}>
      {stall.options.map(([name, detail]) => <button key={name} type="button" aria-pressed={selected?.[0] === name} onClick={() => setSelected([name, detail])}>{name}</button>)}
    </div>
    <div className="market-result" role="status">{selected ? <><strong>{selected[0]}</strong><p>{selected[1]}</p></> : <p>{language === 'en-US' ? 'Select an option to learn more.' : 'Selecione uma opção para descobrir mais.'}</p>}</div>
  </section>;
}
