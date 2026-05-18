import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Database,
  Download,
  Factory,
  Filter,
  Mail,
  Phone,
  Sparkles,
  Workflow,
} from "lucide-react";
import profile from "./data/profile.json";
import projects from "./data/projects.json";
import "./styles.css";

const categories = ["All", "AI", "Manufacturing", "Quality", "Automation", "Data", "Web Apps"];

const categoryIcons = {
  AI: Sparkles,
  Manufacturing: Factory,
  Quality: CheckCircle2,
  Automation: Workflow,
  Data: Database,
  "Web Apps": BriefcaseBusiness,
};

const toolIconMap = {
  "OpenAI Codex": { label: "CX", className: "codex" },
  "Claude Code": { label: "CL", className: "claude" },
  OpenCode: { label: "OC", className: "opencode" },
  Windsurf: { label: "WS", className: "windsurf" },
  "Microsoft Fabric": { label: "FB", className: "fabric" },
};

function App() {
  const [activeCategory, setActiveCategory] = useState("All");
  const filteredProjects = useMemo(() => {
    if (activeCategory === "All") return projects;
    return projects.filter((project) => project.category === activeCategory);
  }, [activeCategory]);

  return (
    <>
      <Header />
      <main>
        <Home />
        <Projects
          activeCategory={activeCategory}
          filteredProjects={filteredProjects}
          setActiveCategory={setActiveCategory}
        />
        <Resume />
        <Skills />
        <Contact />
      </main>
    </>
  );
}

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#home" aria-label={`${profile.name} home`}>
        <span className="brand-mark">JM</span>
        <span>
          <strong>{profile.name}</strong>
          <small>{profile.targetRole} portfolio</small>
        </span>
      </a>
      <nav className="nav-links" aria-label="Primary navigation">
        <a href="#home">Home</a>
        <a href="#projects">Projects</a>
        <a href="#resume">Resume</a>
        <a href="#skills">Skills</a>
        <a href="#contact">Contact</a>
      </nav>
      <a className="header-action" href={profile.resumeDownload} download>
        <Download size={18} aria-hidden="true" />
        Resume
      </a>
    </header>
  );
}

function Home() {
  return (
    <section id="home" className="hero section">
      <div className="hero-copy">
        <p className="eyebrow">Executive technical portfolio</p>
        <h1>AI workflows and internal tools that survive real operations.</h1>
        <p className="hero-text">{profile.summary}</p>
        <div className="hero-actions">
          <a className="button primary" href="#projects">
            View project evidence
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <a className="button secondary" href={profile.resumeDownload} download>
            <Download size={18} aria-hidden="true" />
            Download resume
          </a>
        </div>
      </div>

      <aside className="impact-console" aria-label="Operational impact highlights">
        <div className="console-header">
          <span></span>
          <span></span>
          <span></span>
          <strong>impact-summary.json</strong>
        </div>
        <div className="impact-grid">
          {profile.highlights.map((highlight) => (
            <article key={highlight.label}>
              <small>{highlight.label}</small>
              <strong>{highlight.value}</strong>
              <span>{highlight.detail}</span>
            </article>
          ))}
        </div>
      </aside>
    </section>
  );
}

function Projects({ activeCategory, filteredProjects, setActiveCategory }) {
  return (
    <section id="projects" className="section projects-section">
      <div className="section-heading">
        <p className="eyebrow">Projects</p>
        <h2>Proof you can inspect, filter, and extend.</h2>
        <p>
          Projects are sourced from a local JSON file so the portfolio can grow as new internal tools,
          demos, and case studies are added.
        </p>
      </div>

      <div className="filter-bar" aria-label="Project category filter">
        <Filter size={18} aria-hidden="true" />
        {categories.map((category) => (
          <button
            className={category === activeCategory ? "filter active" : "filter"}
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="project-grid">
        {filteredProjects.map((project) => (
          <ProjectCard project={project} key={project.id} />
        ))}
      </div>
    </section>
  );
}

function ProjectCard({ project }) {
  const Icon = categoryIcons[project.category] ?? BriefcaseBusiness;

  return (
    <article className="project-card">
      <div className="project-topline">
        <span className="category-pill">
          <Icon size={16} aria-hidden="true" />
          {project.category}
        </span>
      </div>
      <h3>{project.title}</h3>
      <p className="project-summary">{project.shortDescription}</p>
      <div className="project-details">
        <div>
          <h4>Problem</h4>
          <p>{project.problem}</p>
        </div>
        <div>
          <h4>Solution</h4>
          <p>{project.solution}</p>
        </div>
      </div>
      <div className="tool-list" aria-label={`Tools used for ${project.title}`}>
        {project.tools.map((tool) => (
          <ToolBadge key={tool} text={tool} />
        ))}
      </div>
      <div className="impact-list">
        <h4>Impact</h4>
        <ul>
          {project.impact.map((impact) => (
            <li key={impact}>{impact}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function Resume() {
  return (
    <section id="resume" className="section resume-section">
      <div className="resume-copy">
        <p className="eyebrow">Resume</p>
        <h2>Resume preview before download.</h2>
        <p>
          This is a web preview in a print-style format so reviewers can scan experience quickly before downloading the full resume file.
        </p>
        <a className="button primary" href={profile.resumeDownload} download>
          <Download size={18} aria-hidden="true" />
          Download resume
        </a>
      </div>

      <div className="resume-preview" aria-label="Print-style resume preview">
        <header>
          <h3>{profile.name}</h3>
          <p>{profile.location} | {profile.phone} | {profile.email}</p>
        </header>

        <section>
          <h4>Summary</h4>
          <p>
            Software development and operations technology leader building AI-enabled workflows,
            internal tools, data systems, and automation across manufacturing, quality, distribution,
            program management, and commercial operations.
          </p>
        </section>

        <section>
          <h4>Experience</h4>
          <article>
            <p className="role-line"><strong>Starkey Laboratories</strong> | Senior Manager, AI-Accelerated Software Development & Operations Technology | 2022 - Present</p>
            <ul>
              <li>Built unified internal software experiences with React front ends and Python back ends.</li>
              <li>Improved order accuracy from 97% to 99.7% and shipment capacity from 1,800/day to 4,200/day.</li>
              <li>Reduced overhead costs by $2.2M annually and identified $634k annual incorrect-order shipping exposure.</li>
              <li>Developed reusable AI/development patterns for internal workflow implementation.</li>
            </ul>
          </article>
          <article>
            <p className="role-line"><strong>Monteris Medical</strong> | Senior Engineer / Documentation Systems Lead | 2020 - 2022</p>
            <ul>
              <li>Led development, verification, validation, and launch of a new MRI-compatible product in 18 months.</li>
              <li>Built controlled documentation systems to improve traceability and reduce unmanaged local files.</li>
            </ul>
          </article>
          <article>
            <p className="role-line"><strong>Donaldson</strong> | Product Manager | 2018 - 2020</p>
            <ul>
              <li>Supported major enterprise customers through product development and strategic planning.</li>
              <li>Built new revenue pipelines during the pandemic through market and network execution.</li>
            </ul>
          </article>
        </section>

        <section>
          <h4>Core Stack</h4>
          <p>React | Python | SQL | APIs | Microsoft Fabric | Dataverse | Power Platform | Azure | Cosmos DB | Workflow Automation</p>
        </section>
      </div>
    </section>
  );
}

function Skills() {
  return (
    <section id="skills" className="section skills-section">
      <div className="section-heading">
        <p className="eyebrow">Skills</p>
        <h2>Technical range with operations judgment.</h2>
      </div>
      <div className="skill-grid">
        {Object.entries(profile.skills).map(([group, skills]) => (
          <article className="skill-card" key={group}>
            <h3>{group}</h3>
            <div>
              {skills.map((skill) => (
                <ToolBadge key={skill} text={skill} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ToolBadge({ text }) {
  const toolIcon = toolIconMap[text];
  if (!toolIcon) {
    return <span>{text}</span>;
  }

  return (
    <span className={`tool-badge ${toolIcon.className}`}>
      <i aria-hidden="true">{toolIcon.label}</i>
      {text}
    </span>
  );
}

function Contact() {
  return (
    <section id="contact" className="section contact-section">
      <div>
        <p className="eyebrow">Contact</p>
        <h2>Ready to talk through the systems behind the resume.</h2>
      </div>
      <div className="contact-actions">
        <a className="contact-card" href={`mailto:${profile.email}`}>
          <Mail size={20} aria-hidden="true" />
          <span>Email</span>
          <strong>{profile.email}</strong>
        </a>
        <a className="contact-card" href={`tel:+1${profile.phone.replaceAll("-", "")}`}>
          <Phone size={20} aria-hidden="true" />
          <span>Phone</span>
          <strong>{profile.phone}</strong>
        </a>
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
