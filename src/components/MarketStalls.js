import { useState } from 'react';

const stalls = {
  technologies: {
    title: 'Ferramentas da jornada', intro: 'Escolha uma área para conhecer as tecnologias do currículo.',
    options: [
      ['Front-end', 'React.js, JavaScript, TypeScript, Redux, HTML5, CSS3, Sass e Bootstrap.'],
      ['Back-end e APIs', 'Node.js, Laravel, Java Web e APIs REST.'],
      ['Dados', 'PostgreSQL, MySQL, MongoDB e Firebase.'],
      ['Qualidade e ferramentas', 'Jest, Playwright, Git, GitHub, Linux, Scrum e IA generativa.'],
    ],
  },
  experience: {
    title: 'Jornada profissional', intro: 'Escolha uma experiência para conhecer o trabalho realizado.',
    options: [
      ['FUNCAP', 'Desenvolvedor Front End bolsista (08/2021 a 04/2026). Atuação em uma vitrine digital de dados, com React, Next.js, PHP, Laravel, PostgreSQL e IA generativa.'],
      ['TOTVS', 'Desenvolvedor Full Stack (06/2022 a 05/2023). Estágio com foco no ERP Protheus, desenvolvimento com ADVPL e tecnologias web e integração de APIs REST.'],
      ['Núcleo de Soluções de Software — UFC', 'Desenvolvedor Full Stack (05/2021 a 09/2021). Estágio com análise de requisitos e manutenção do sistema DARWIN, desenvolvimento com Java e HTML5 e uso de Scrum.'],
    ],
  },
  education: {
    title: 'Formação e aprendizado', intro: 'Escolha uma etapa para conhecer a formação e os cursos.',
    options: [
      ['Engenharia de Software', 'Bacharelado em Engenharia de Software na Universidade Federal do Ceará (2018 a 2023).'],
      ['Administração', 'Técnico em Administração na EEEP Leopoldina Gonçalves Quezado (2015 a 2017).'],
      ['Cursos', 'Curso profissional de UX Design da Google em andamento e Impulso Bootcamp Full Stack Developer.'],
    ],
  },
};

const englishStalls = {
  technologies: { title: 'Tools of the journey', intro: 'Choose an area to explore the technologies in my resume.', options: [
    ['Front-end', 'React.js, JavaScript, TypeScript, Redux, HTML5, CSS3, Sass and Bootstrap.'],
    ['Back-end and APIs', 'Node.js, Laravel, Java Web and REST APIs.'],
    ['Data', 'PostgreSQL, MySQL, MongoDB and Firebase.'],
    ['Quality and tools', 'Jest, Playwright, Git, GitHub, Linux, Scrum and generative AI.'],
  ] },
  experience: { title: 'Professional journey', intro: 'Choose a role to learn about my work.', options: [
    ['FUNCAP', 'Front-end developer fellow (08/2021 to 04/2026). Worked on a digital data showcase using React, Next.js, PHP, Laravel, PostgreSQL and generative AI.'],
    ['TOTVS', 'Full-stack developer (06/2022 to 05/2023). Internship focused on Protheus ERP, ADVPL, web development and REST API integration.'],
    ['Software Solutions Center — UFC', 'Full-stack developer (05/2021 to 09/2021). Internship involving requirements analysis, maintenance of DARWIN, Java, HTML5 and Scrum.'],
  ] },
  education: { title: 'Education and learning', intro: 'Choose a topic to learn about my education and courses.', options: [
    ['Software Engineering', 'Bachelor of Software Engineering at the Federal University of Ceará (2018 to 2023).'],
    ['Business Administration', 'Technical qualification in Business Administration at EEEP Leopoldina Gonçalves Quezado (2015 to 2017).'],
    ['Courses', 'Google UX Design Professional Certificate in progress and Impulso Full Stack Developer Bootcamp.'],
  ] },
};

export function MarketStall({ type, language = 'pt-BR' }) {
  const stall = language === 'en-US' ? englishStalls[type] : stalls[type];
  const [selected, setSelected] = useState(null);
  return <section className="story market-content">
    <h3>{stall.title}</h3><p>{stall.intro}</p>
    <div className="market-options" role="group" aria-label={stall.title}>
      {stall.options.map(([name, detail]) => <button key={name} type="button" aria-pressed={selected?.[0] === name} onClick={() => setSelected([name, detail])}>{name}</button>)}
    </div>
    <div className="market-result" role="status">{selected ? <><strong>{selected[0]}</strong><p>{selected[1]}</p></> : <p>{language === 'en-US' ? 'Select an option to learn more.' : 'Selecione uma opção para descobrir mais.'}</p>}</div>
  </section>;
}
