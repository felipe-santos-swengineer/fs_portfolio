import talkdoorFeed from './assets/images/talkdoor-feed.webp';
import talkdoorBusca from './assets/images/talkdoor-busca.webp';
import Vitrine1 from './assets/images/vitrine1.png';
import Vitrine2 from './assets/images/vitrine2.png';
import Vitrine3 from './assets/images/vitrine3.png';
import Vitrine4 from './assets/images/vitrine4.png';
import Vitrine5 from './assets/images/vitrine5.png';
import Tetris1 from './assets/images/tetris1.png';
import Tetris2 from './assets/images/tetris2.png';
import Tetris3 from './assets/images/tetris3.png';
import chronosAtividades from './assets/images/chronos-atividades.webp';
import chronosAvaliacao from './assets/images/chronos-avaliacao.webp';
import orbitaChamados from './assets/images/orbita-chamados.webp';
import orbitaConhecimento from './assets/images/orbita-conhecimento.webp';
import orbitaIndicadores from './assets/images/orbita-indicadores.webp';
import freelancerCommerce from './assets/images/freelancer-commerce.webp';
import freelancerDashboard from './assets/images/freelancer-dashboard.webp';
import telaLivre from './assets/images/tela-livre.webp';
import clickdownQuadro from './assets/images/clickdown-quadro.webp';
import clickdownLista from './assets/images/clickdown-lista.webp';
import telaLivreEspectador from './assets/images/tela-livre-espectador.webp';
import nexoFicha from './assets/images/nexo-ficha.webp';
import nexoConferencia from './assets/images/nexo-conferencia.webp';
import chatIaLocalConversa from './assets/images/chat-ia-local-conversa.webp';
import montenegroInicio from './assets/images/montenegro-inicio.webp';
import montenegroOportunidades from './assets/images/montenegro-oportunidades.webp';
import montenegroResultados from './assets/images/montenegro-resultados.webp';
export const projetos = [
    {
      id: 2,
      titulo: "Vitrine Funcap",
      contexto: "Participação no desenvolvimento front-end",
      tecnologias: "React e Node.js na primeira versão; Laravel em etapa posterior",
      desafio: "Dar visibilidade a iniciativas de pesquisa e inovação e aproximá-las da sociedade.",
      descricao: "Plataforma de divulgação de iniciativas de pesquisa, inovação e empreendedorismo apoiadas pela Fundação Cearense de Apoio ao Desenvolvimento Científico e Tecnológico.\n\nA vitrine apresenta projetos desenvolvidos no Ceará, suas soluções e possibilidades de aplicação. O objetivo é tornar a produção científica mais acessível e aproximar pesquisadores, empresas, investidores e sociedade.",
      imagens: [
        Vitrine1,
        Vitrine2,
        Vitrine3,
        Vitrine4,
        Vitrine5
      ],
      link: "https://vitrinefuncap.com"
    },
    {
      id: 11,
      titulo: "Plataforma Montenegro",
      contexto: "Participação no desenvolvimento do portal de fomento da Funcap",
      desafio: "Reunir oportunidades, editais e resultados de fomento da Funcap em um único portal.",
      descricao: "A Plataforma Montenegro reúne os serviços e as informações de fomento da Funcap. Pelo portal, pesquisadores, instituições e empresas podem buscar oportunidades pelo título ou número do edital, consultar prazos e acessar a submissão de propostas.\n\nA plataforma também publica resultados de seleções, disponibiliza documentos em PDF e oferece áreas de transparência e acesso aos portais de usuários.",
      tecnologias: "Next.js, Laravel",
      imagens: [montenegroInicio, montenegroOportunidades, montenegroResultados],
      imagensAlt: [
        "Página inicial da Plataforma Montenegro com navegação e notícias da Funcap.",
        "Página de oportunidades de fomento, com busca, filtros e chamadas abertas.",
        "Página de resultados de fomento, com filtros, resultados publicados e links para baixar documentos.",
      ],
      link: "https://plataformamontenegro.com.br/",
    },
    {
      id: 4,
      titulo: "Chronos-UFC",
      tecnologias: "React, Node.js, PostgreSQL",
      contexto: "Bolsista de desenvolvimento full-stack na UFC",
      desafio: "Facilitar o registro e a avaliação de atividades complementares na graduação.",
      descricao: "Sistema de gestão de atividades complementares para alunos da Universidade Federal do Ceará. O estudante registra suas atividades, informa a carga horária e anexa os comprovantes.\n\nProfessores ou coordenadores avaliam os registros, aprovam as horas ou solicitam ajustes com comentários. O acompanhamento por categoria ajuda o aluno a entender o que já concluiu e o que falta para cumprir os requisitos de formação.",
      imagens: [chronosAtividades, chronosAvaliacao],
      imagensAlt: [
        "Prévia simulada da área do estudante no Chronos, com horas complementares e atividades enviadas.",
        "Prévia simulada da avaliação no Chronos, com comprovante, horas validadas e feedback ao estudante.",
      ],
    },
    {
      id: 6,
      titulo: "Órbita",
      contexto: "Central de atendimento e base de conhecimento",
      desafio: "Acompanhar solicitações de suporte e reaproveitar soluções já revisadas pela equipe.",
      descricao: "Solicitantes abrem chamados e acompanham o atendimento. Atendentes organizam prioridades, consultam casos semelhantes e podem gerar rascunhos com Ollama usando trechos de artigos da base. A equipe revisa as sugestões antes de aprovar uma resposta e pode transformar uma solução em artigo.\n\nA aplicação tem permissões por papel e indicadores de atendimento, como pendências, tempo médio de resolução e cumprimento de SLA. A demonstração online usa dados fictícios. O processamento com Ollama faz parte da versão local.",
      tecnologias: "JavaScript, FastAPI, SQLite, Ollama",
      imagens: [orbitaChamados, orbitaConhecimento, orbitaIndicadores],
      github: "https://github.com/felipe-santos-swengineer/orbita-suporte",
    },
    {
      id: 5,
      titulo: "ClickDown",
      contexto: "Gestão colaborativa de projetos",
      desafio: "Dar à equipe uma visão compartilhada do trabalho, dos prazos e de quem está responsável.",
      descricao: "Equipes organizam tarefas e subtarefas em um quadro Kanban de colunas configuráveis. O mesmo trabalho pode ser consultado em lista ou calendário, com filtros por prioridade, prazo e responsável. Cada tarefa pode ter vários responsáveis, checklist, comentários com menções e anexos.\n\nO servidor aplica permissões por projeto e registra quem fez cada mudança. Notificações e lembretes ajudam a acompanhar atribuições, menções e prazos.",
      tecnologias: "React, TypeScript, Vite, Express, SQLite",
      imagens: [clickdownQuadro, clickdownLista],
      imagensAlt: [
        "Prévia simulada do quadro Kanban do ClickDown com filtros, indicadores e tarefas em quatro colunas.",
        "Prévia simulada da lista do ClickDown com status, prioridade e responsável por tarefa.",
      ],
      github: "https://github.com/felipe-santos-swengineer/click-down",
    },
    {
      id: 1,
      titulo: "Talkdoor",
      tecnologias: "React, Node.js, PostgreSQL",
      contexto: "Projeto de conclusão de curso",
      desafio: "Aproximar estudantes, professores e pesquisadores em um espaço de colaboração acadêmica.",
      descricao: "Rede social acadêmica desenvolvida no meu TCC para aproximar estudantes, professores e pesquisadores. A plataforma reúne artigos, eventos, discussões de disciplinas, projetos de pesquisa e oportunidades acadêmicas.\n\nA proposta é facilitar a colaboração dentro da universidade, com um feed que prioriza conteúdos de acordo com os interesses de cada usuário.",
      imagens: [talkdoorFeed, talkdoorBusca],
      imagensAlt: [
        "Prévia simulada do feed acadêmico do Talkdoor, com publicações, curtidas e comentários.",
        "Prévia simulada da busca de pessoas no Talkdoor, com resultados e acesso aos perfis acadêmicos.",
      ],
    },
    {
      id: 7,
      titulo: "Nexo",
      contexto: "Aplicação educacional de inteligência artificial",
      desafio: "Explicar como a IA produz respostas e como conferir o que ela devolve, sem exigir programação.",
      descricao: "Em uma missão guiada, a pessoa monta um convite e verifica as informações com a ficha da festa. Outras atividades usam situações do cotidiano para mostrar como sistemas preveem texto, aproximam ideias e consultam fontes antes de responder.\n\nO laboratório permite carregar documentos de texto, comparar configurações de busca e inspecionar os trechos encontrados. Uma área de avaliação compara resultados com fontes esperadas.",
      tecnologias: "React, TypeScript, Vite",
      imagens: [nexoFicha, nexoConferencia],
      imagensAlt: [
        "Prévia simulada da Missão guiada do Nexo com a ficha da festa.",
        "Prévia simulada da etapa que compara o convite com a ficha e identifica um endereço sem confirmação.",
      ],
      github: "https://github.com/felipe-santos-swengineer/ia-learning",
      link: "https://felipe-santos-swengineer.github.io/ia-learning/#mission",
    },
    {
      id: 9,
      titulo: "Freelancer Vitrine",
      contexto: "Catálogo de aplicações demonstrativas",
      desafio: "Mostrar como diferentes interfaces atendem a necessidades de negócio e de produto.",
      descricao: "A vitrine reúne modelos navegáveis, como comércio eletrônico com carrinho e checkout simulado, agenda de serviços, painel de indicadores com filtros e exportação CSV, além de jogos e experiências 3D.\n\nO catálogo permite filtrar por categoria e estilo visual. Nos modelos, é possível trocar a apresentação sem perder os dados ou o progresso da sessão.",
      tecnologias: "Next.js, React, TypeScript, Three.js, Canvas 2D",
      imagens: [freelancerCommerce, freelancerDashboard],
      github: "https://github.com/felipe-santos-swengineer/freelancer-vitrine",
      link: "https://felipe-santos-swengineer.github.io/freelancer-vitrine/",
    },
    {
      id: 8,
      titulo: "Tela Livre",
      contexto: "Compartilhamento de tela ao vivo",
      desafio: "Permitir que alguém mostre uma janela, aba ou tela ao vivo para quem receber um link.",
      descricao: "Quem transmite escolhe o que compartilhar, a resolução, a taxa de quadros e, quando disponível, o áudio da tela ou da aba. Quem recebe o link assiste pelo navegador.\n\nO Supabase Realtime coordena a conexão, e o WebRTC envia o vídeo diretamente do transmissor a cada espectador. A transmissão depende de uma conexão direta entre os participantes.",
      tecnologias: "Next.js, TypeScript, WebRTC, Supabase Realtime",
      imagens: [telaLivre, telaLivreEspectador],
      imagensAlt: [
        "Ilustração da interface do Tela Livre com prévia da transmissão e controles de resolução e taxa de quadros.",
        "Prévia simulada da interface do espectador assistindo a uma tela compartilhada ao vivo.",
      ],
      github: "https://github.com/felipe-santos-swengineer/tela-livre",
    },
    {
      id: 10,
      titulo: "Chat IA Local",
      contexto: "Aplicação full-stack de conversa com IA",
      desafio: "Explorar como integrar um modelo de linguagem local a uma interface de chat.",
      descricao: "A interface envia a mensagem para uma API em Express. O servidor encaminha a solicitação ao Ollama, que executa o modelo Llama 3 localmente. A API registra a pergunta e a resposta no Supabase e devolve a resposta ao navegador.",
      tecnologias: "React, TypeScript, Tailwind CSS, Node.js, Express, Ollama, Supabase",
      imagens: [chatIaLocalConversa],
      imagensAlt: ["Prévia simulada do Chat IA Local mostrando uma conversa sobre como organizar os estudos de programação."],
      github: "https://github.com/felipe-santos-swengineer/chatgpt-offline",
    },
    {
      id: 3,
      titulo: "Tetris para 2 jogadores",
      tecnologias: "C++, SFML",
      contexto: "Jogo competitivo para duas pessoas",
      desafio: "Combinar estratégia, raciocínio espacial e interação entre jogadores.",
      descricao: "Uma versão competitiva de Tetris para duas pessoas: cada jogador organiza suas peças, completa linhas e envia obstáculos ao adversário.\n\nO duelo combina raciocínio espacial, estratégia e reflexos em uma experiência compartilhada, com uma trilha inspirada nas batalhas de Naruto.",
      imagens: [
        Tetris1,
        Tetris2,
        Tetris3
      ],
      github: "https://github.com/felipe-santos-swengineer/tetris-2-players"
    },
  ];
export const textos = [
  "Sou Felipe Santos, engenheiro de software. Esta vila é um convite para conhecer meu trabalho de um jeito diferente: explorando, descobrindo e escolhendo o próprio caminho.\n\nNa taverna, conto como cheguei até aqui. Na biblioteca, compartilho minha formação e experiência. Na oficina, apresento os projetos que construí. E, no correio, a conversa pode continuar.\n\nVocê pode caminhar pelas ruas ou usar os atalhos para ir direto ao que procura. Entre, fique à vontade e explore no seu ritmo.",
  "Sempre gostei de histórias em que cada descoberta abre uma nova possibilidade. No desenvolvimento de software, encontro algo parecido: uma ideia vira interface, uma necessidade vira ferramenta e um problema vira oportunidade de aprender.\n\nEste portfólio nasceu da vontade de unir código, design e a linguagem dos RPGs. A vila dá forma a essa mistura: cada edifício guarda uma parte da minha trajetória, e cada projeto registra uma solução que saiu do papel.\n\nPor trás da ambientação, meu propósito é simples: criar experiências que façam sentido para quem usa e tenham uma estrutura que permita continuar evoluindo.",
  "Minha aproximação com a tecnologia começou com uma pergunta: como isso funciona? Eu queria entender o que acontecia por trás das telas dos sites, aplicativos e jogos que usava.\n\nEssa curiosidade me levou às linguagens, aos algoritmos e à engenharia de software. Descobrir como as peças se conectam continua sendo uma das partes mais interessantes do meu trabalho.\n\nHoje, transformo essa vontade de aprender em interfaces, sistemas e experiências interativas. Cada desafio é uma chance de investigar, construir e aprimorar a solução.",
  "Minha trajetória na Universidade Federal do Ceará começou em 2018, quando ingressei pelo SISU no curso de Engenharia de Software, no campus de Russas.\n\nDurante o bacharelado, estudei requisitos, estruturas de dados, programação e os fundamentos que sustentam a construção de software. Os projetos acadêmicos também me deram espaço para experimentar e trabalhar com problemas concretos.\n\nLevei essa base para o mercado e continuo ampliando meu repertório com a prática: compreender a necessidade, escolher uma abordagem e melhorar o resultado a cada entrega.",
  "Funcap · Bolsista de desenvolvimento front-end | ago. 2021 – abr. 2026\nParticipei do desenvolvimento da Vitrine Funcap, que divulga dados e iniciativas de inovação pública e empresarial, e da Plataforma Montenegro, que reúne oportunidades, editais e resultados de fomento. Trabalhei com JavaScript, React, Next.js e Laravel, criei e mantive bases PostgreSQL e apliquei IA generativa em soluções da Funcap. Também participei da manutenção, do atendimento e da disponibilização das aplicações em rede.\n\nTOTVS · Estágio em desenvolvimento full-stack | jun. 2022 – maio 2023\nDesenvolvi e mantive soluções para o ERP Protheus em AdvPL e aplicações web com JavaScript, Node.js e React. Implementei e integrei APIs REST para aplicações corporativas.\n\nNúcleo de Soluções de Software da UFC · Estágio em desenvolvimento full-stack | maio – set. 2021\nAnalisei requisitos e mantive o DARWIN, sistema de gestão de seleções e competições usado em processos de bolsas do campus de Russas, incluindo PIBI, PAIP e PID. Desenvolvi com Java e HTML5 em uma equipe que adotava Scrum.\n\nChronos-UFC · Bolsista de desenvolvimento full-stack | abr. 2021 – jan. 2022\nTrabalhei com React, Node.js e PostgreSQL em um sistema que permite registrar atividades complementares, anexar comprovantes e acompanhar a avaliação e as horas validadas.\n\nTecnologias e ferramentas\nNo front-end, trabalho com React, Next.js, TypeScript, Redux, HTML5, CSS3, Sass, Bootstrap e Tailwind CSS. No back-end, uso Node.js, Laravel, Java Web e APIs REST. Tenho experiência com PostgreSQL, MySQL, MongoDB e Firebase. Uso Git, GitHub, Linux e VS Code no desenvolvimento, além de Jest e Playwright para testes.\n\nAgentes e IA local\nUso Codex, Google Antigravity, GitHub Copilot e OpenCode no desenvolvimento. Também trabalho com engenharia de prompts e modelos de linguagem executados localmente com Ollama.",
  "Gosto de investigar antes de escolher um caminho. Curiosidade, persistência e pensamento analítico me ajudam a entender problemas e transformar ideias em soluções.\n\nInterfaces e experiências interativas\nTenho afinidade com React e com a construção de sistemas modulares. Procuro organizar componentes para que a interface seja agradável de usar e possa crescer sem perder clareza.\n\nDesign e narrativa visual\nAcredito que tipografia, cores e interação também contam uma história. Este portfólio é um espaço para explorar essa relação entre apresentação e funcionalidade.\n\nGames, RPGs e aprendizado\nOs jogos me interessam pela colaboração, pela estratégia e pela liberdade de explorar. Fora deles, continuo buscando novas referências em desenvolvimento, arquitetura de software e design.",
  "Esta é a oficina da vila: o lugar onde ideias se tornam soluções. Aqui reuni projetos de contextos diferentes, da colaboração acadêmica à divulgação científica, passando por gestão universitária e jogos.\n\nEm cada projeto, você encontra o problema que motivou a construção, as principais funcionalidades e imagens da interface. Os links levam ao código ou à publicação disponível.\n\nExplore as telas e conheça as escolhas por trás de cada criação.",
  "Uma boa jornada também se faz em companhia. Se você quer conversar sobre um projeto, trocar ideias sobre tecnologia ou conhecer melhor meu trabalho, escolha um dos canais abaixo.\n\nObrigado pela visita. As portas da vila continuam abertas para sua próxima descoberta."
];

export const titulosTextos = [
  "Bem-vindo à vila",
  "Por que uma vila?",
  "A curiosidade que move a jornada",
  "Formação",
  "Experiência e habilidades",
  "O que me inspira",
  "Da ideia à construção",
  "Vamos conversar?"
];
