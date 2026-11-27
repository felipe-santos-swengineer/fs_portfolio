import { DiJava } from 'react-icons/di';
import {
  SiBootstrap, SiCss3, SiFirebase, SiGit, SiGithub, SiGithubcopilot, SiHtml5,
  SiJavascript, SiJest, SiLaravel, SiLinux, SiMongodb, SiMysql, SiNextdotjs,
  SiNodedotjs, SiOllama, SiOpenai, SiPostgresql, SiReact, SiRedux, SiSass,
  SiTailwindcss, SiTypescript,
} from 'react-icons/si';
import { VscVscode } from 'react-icons/vsc';
import { getMarketStall } from './MarketStalls';
import playwrightLogo from '../assets/images/technology/playwright.svg';
import antigravityLogo from '../assets/images/technology/antigravity.svg';
import opencodeLogo from '../assets/images/technology/opencode.png';

const technologyGroups = [
  [
    ['React', SiReact, '#61dafb'], ['Next.js', SiNextdotjs], ['JavaScript', SiJavascript, '#f7df1e'],
    ['TypeScript', SiTypescript, '#79baff'], ['Redux', SiRedux, '#b899ec'], ['HTML5', SiHtml5, '#f27f60'],
    ['CSS3', SiCss3, '#69aaf4'], ['Sass', SiSass, '#ef99c1'], ['Bootstrap', SiBootstrap, '#bca0f2'],
    ['Tailwind CSS', SiTailwindcss, '#63d6e5'],
  ],
  [['Node.js', SiNodedotjs, '#96d982'], ['Laravel', SiLaravel, '#ff7968'], ['Java', DiJava, '#f7a479']],
  [
    ['PostgreSQL', SiPostgresql, '#83b8df'], ['MySQL', SiMysql, '#8ac5dd'],
    ['MongoDB', SiMongodb, '#81d889'], ['Firebase', SiFirebase, '#ffcb57'],
  ],
  [
    ['Jest', SiJest, '#e793ae'], ['Git', SiGit, '#ff8c6f'], ['GitHub', SiGithub],
    ['Linux', SiLinux, '#fada72'], ['VS Code', VscVscode, '#62b4f6'], ['Playwright', playwrightLogo],
  ],
  [['Codex', SiOpenai], ['Google Antigravity', antigravityLogo], ['GitHub Copilot', SiGithubcopilot], ['OpenCode', opencodeLogo], ['Ollama', SiOllama]],
];

function EditorialSkills({ language }) {
  const { options } = getMarketStall('technologies', language);
  return <div className="editorial-skills">
    {options.map(([category, description], index) => (
      <article className="editorial-skill" key={category}>
        <h3>{category}</h3>
        <p>{description}</p>
        <div className="editorial-tech-icons">
          {technologyGroups[index].map(([name, Icon, color]) => (
            <span key={name} title={name}>
              {typeof Icon === 'string'
                ? <img src={Icon} alt="" loading="lazy" />
                : <Icon aria-hidden="true" focusable="false" style={{ color }} />}
              <span className="sr-only">{name}</span>
            </span>
          ))}
        </div>
      </article>
    ))}
  </div>;
}

function EditorialEducation({ language }) {
  const { options } = getMarketStall('education', language);
  return <ol className="editorial-timeline editorial-education">
    {options.map(([name, description]) => (
      <li className="career-entry" key={name}>
        <h3>{name}</h3>
        <p>{description}</p>
      </li>
    ))}
  </ol>;
}

export default function EditorialQualifications({ language, type }) {
  return type === 'technologies' ? <EditorialSkills language={language} /> : <EditorialEducation language={language} />;
}
