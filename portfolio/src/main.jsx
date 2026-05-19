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
const ICON_LAB_HASH = "#icon-lab-7f3k";

const categoryIcons = {
  AI: Sparkles,
  Manufacturing: Factory,
  Quality: CheckCircle2,
  Automation: Workflow,
  Data: Database,
  "Web Apps": BriefcaseBusiness,
};

const favicon = (domain) => `https://www.google.com/s2/favicons?sz=64&domain_url=${domain}`;

const skillsGroupIconMap = {
  AI: favicon("openai.com"),
  "Web Apps": favicon("react.dev"),
  Data: favicon("microsoft.com"),
  Automation: favicon("powerautomate.microsoft.com"),
  Systems: favicon("salesforce.com"),
};

const toolIconMap = {
  "OpenAI Codex": { src: favicon("openai.com"), alt: "OpenAI logo", className: "codex" },
  "Claude Code": { src: favicon("anthropic.com"), alt: "Anthropic logo", className: "claude" },
  OpenCode: { src: favicon("opencode.ai"), alt: "OpenCode logo", className: "opencode" },
  Windsurf: { src: favicon("windsurf.com"), alt: "Windsurf logo", className: "windsurf" },
  "GitHub Copilot": { src: favicon("github.com"), alt: "GitHub logo", className: "copilot" },
  "Prompt frameworks": { src: favicon("openai.com"), alt: "OpenAI logo", className: "prompt" },
  "Agent-style workflows": { src: favicon("n8n.io"), alt: "n8n logo", className: "agent" },
  "Custom AI/development skills": { src: favicon("openai.com"), alt: "OpenAI logo", className: "custom-ai" },
  React: { src: favicon("react.dev"), alt: "React logo", className: "react" },
  Python: { src: favicon("python.org"), alt: "Python logo", className: "python" },
  APIs: { src: favicon("swagger.io"), alt: "Swagger logo", className: "apis" },
  "Internal web tools": { src: favicon("web.dev"), alt: "Web logo", className: "webtools" },
  "Reusable UI patterns": { src: favicon("mui.com"), alt: "MUI logo", className: "ui-patterns" },
  "Workflow surfaces": { src: favicon("figma.com"), alt: "Figma logo", className: "workflow-surfaces" },
  SQL: { src: favicon("postgresql.org"), alt: "PostgreSQL logo", className: "sql" },
  Dataverse: { src: favicon("powerplatform.microsoft.com"), alt: "Microsoft logo", className: "dataverse" },
  "Cosmos DB": { src: favicon("azure.microsoft.com"), alt: "Microsoft logo", className: "cosmos" },
  "Microsoft Fabric": { src: favicon("microsoft.com"), alt: "Microsoft logo", className: "fabric" },
  "Power BI": { src: favicon("powerbi.microsoft.com"), alt: "Power BI logo", className: "powerbi" },
  Dashboards: { src: favicon("grafana.com"), alt: "Grafana logo", className: "dashboards" },
  "Operational analytics": { src: favicon("tableau.com"), alt: "Tableau logo", className: "analytics" },
  "Power Automate": { src: favicon("powerautomate.microsoft.com"), alt: "Power Automate logo", className: "power-automate" },
  "Approval workflows": { src: favicon("atlassian.com"), alt: "Atlassian logo", className: "approval" },
  "Document review support": { src: favicon("adobe.com"), alt: "Adobe logo", className: "document-review" },
  "Reporting automation": { src: favicon("powerbi.microsoft.com"), alt: "Power BI logo", className: "reporting" },
  "Workflow tracking": { src: favicon("atlassian.com"), alt: "Atlassian logo", className: "workflow-tracking" },
  "Salesforce-adjacent workflows": { src: favicon("salesforce.com"), alt: "Salesforce logo", className: "salesforce" },
  "Warehouse systems": { src: favicon("infor.com"), alt: "Infor logo", className: "warehouse" },
  "Manufacturing systems": { src: favicon("siemens.com"), alt: "Siemens logo", className: "manufacturing" },
  "Document control": { src: favicon("sharepoint.com"), alt: "Microsoft SharePoint logo", className: "document-control" },
  MediaWiki: { src: favicon("mediawiki.org"), alt: "MediaWiki logo", className: "mediawiki" },
  Windchill: { src: favicon("ptc.com"), alt: "PTC logo", className: "windchill" },
};

const iconLabTools = [
  "OpenAI Codex",
  "Claude Code",
  "OpenCode",
  "Windsurf",
  "GitHub Copilot",
  "Prompt frameworks",
  "Agent-style workflows",
  "Custom AI/development skills",
  "React",
  "Python",
  "APIs",
  "Internal web tools",
  "Reusable UI patterns",
  "Workflow surfaces",
  "SQL",
  "Dataverse",
  "Cosmos DB",
  "Microsoft Fabric",
  "Power BI",
  "Dashboards",
  "Operational analytics",
  "Power Automate",
  "Approval workflows",
  "Document review support",
  "Reporting automation",
  "Workflow tracking",
  "Salesforce-adjacent workflows",
  "Warehouse systems",
  "Manufacturing systems",
  "Document control",
  "MediaWiki",
  "Windchill",
];

const ICON_OVERRIDE_KEY = "portfolio_tool_icon_overrides_v1";
const ICON_ADMIN_TOKEN_KEY = "portfolio_icon_admin_token_v1";

async function fetchKvOverrides() {
  const response = await fetch("/api/icons", { method: "GET" });
  if (!response.ok) throw new Error(`GET /api/icons failed: ${response.status}`);
  const payload = await response.json();
  return payload.overrides || {};
}

async function saveKvOverrides(overrides, token) {
  const response = await fetch("/api/icons", {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      "x-icon-admin-token": token,
    },
    body: JSON.stringify({ overrides }),
  });
  if (!response.ok) {
    const msg = await response.text();
    throw new Error(`PUT /api/icons failed: ${response.status} ${msg}`);
  }
  return response.json();
}

function App() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [hash, setHash] = useState(window.location.hash || "");
  const [iconOverrides, setIconOverrides] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem(ICON_OVERRIDE_KEY) || "{}");
    } catch {
      return {};
    }
  });

  React.useEffect(() => {
    const onHash = () => setHash(window.location.hash || "");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    fetchKvOverrides()
      .then((remote) => {
        if (!mounted) return;
        setIconOverrides(remote);
        window.localStorage.setItem(ICON_OVERRIDE_KEY, JSON.stringify(remote));
      })
      .catch(() => {
        // Keep local fallback when KV isn't configured yet.
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredProjects = useMemo(() => {
    if (activeCategory === "All") return projects;
    return projects.filter((project) => project.category === activeCategory);
  }, [activeCategory]);

  const resolvedToolIcons = useMemo(() => {
    const next = { ...toolIconMap };
    for (const [name, value] of Object.entries(iconOverrides)) {
      if (!value) continue;
      const existing = next[name] || { alt: `${name} icon`, className: "custom" };
      next[name] = { ...existing, src: value };
    }
    return next;
  }, [iconOverrides]);

  if (hash === ICON_LAB_HASH) {
    return (
      <IconLab
        overrides={iconOverrides}
        setOverrides={setIconOverrides}
      />
    );
  }

  return (
    <>
      <Header />
      <main>
        <Home />
        <Projects
          activeCategory={activeCategory}
          filteredProjects={filteredProjects}
          setActiveCategory={setActiveCategory}
          resolvedToolIcons={resolvedToolIcons}
        />
        <Resume resolvedToolIcons={resolvedToolIcons} />
        <Skills resolvedToolIcons={resolvedToolIcons} />
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

function Projects({ activeCategory, filteredProjects, setActiveCategory, resolvedToolIcons }) {
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
          <ProjectCard project={project} key={project.id} resolvedToolIcons={resolvedToolIcons} />
        ))}
      </div>
    </section>
  );
}

function ProjectCard({ project, resolvedToolIcons }) {
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
          <ToolBadge key={tool} text={tool} resolvedToolIcons={resolvedToolIcons} />
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

function Resume({ resolvedToolIcons }) {
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
        <a className="button secondary" href={profile.resumeDownload} target="_blank" rel="noreferrer">
          View in browser
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
          <div className="resume-tool-icons" aria-label="Primary AI tool stack">
            <ToolBadge text="OpenAI Codex" resolvedToolIcons={resolvedToolIcons} />
            <ToolBadge text="Claude Code" resolvedToolIcons={resolvedToolIcons} />
            <ToolBadge text="Windsurf" resolvedToolIcons={resolvedToolIcons} />
            <ToolBadge text="OpenCode" resolvedToolIcons={resolvedToolIcons} />
            <ToolBadge text="Microsoft Fabric" resolvedToolIcons={resolvedToolIcons} />
          </div>
        </section>

        <section>
          <h4>Full Resume File</h4>
          <p>Live file preview of the same resume used by the download button.</p>
          <iframe
            className="resume-file-frame"
            src={profile.resumeDownload}
            title="Full resume file preview"
          />
        </section>
      </div>
    </section>
  );
}

function Skills({ resolvedToolIcons }) {
  return (
    <section id="skills" className="section skills-section">
      <div className="section-heading">
        <p className="eyebrow">Skills</p>
        <h2>Technical range with operations judgment.</h2>
      </div>
      <div className="skill-grid">
        {Object.entries(profile.skills).map(([group, skills]) => (
          <article className="skill-card" key={group}>
            <h3 className="skill-group-title">
              <img src={skillsGroupIconMap[group]} alt={`${group} icon`} />
              {group}
            </h3>
            <div>
              {skills.map((skill) => (
                <ToolBadge key={skill} text={skill} resolvedToolIcons={resolvedToolIcons} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ToolBadge({ text, resolvedToolIcons }) {
  const icons = resolvedToolIcons || toolIconMap;
  const toolIcon = icons[text];
  if (!toolIcon) {
    return <span>{text}</span>;
  }

  return (
    <span className={`tool-badge ${toolIcon.className}`}>
      <i aria-hidden="true">
        <img src={toolIcon.src} alt={toolIcon.alt} />
      </i>
      {text}
    </span>
  );
}

function IconLab({ overrides, setOverrides }) {
  const [draft, setDraft] = useState(() => ({ ...overrides }));
  const [jsonDraft, setJsonDraft] = useState("");
  const [adminToken, setAdminToken] = useState(() => window.localStorage.getItem(ICON_ADMIN_TOKEN_KEY) || "");

  const setValue = (name, value) => setDraft((prev) => ({ ...prev, [name]: value.trim() }));

  const save = () => {
    window.localStorage.setItem(ICON_OVERRIDE_KEY, JSON.stringify(draft));
    setOverrides(draft);
    alert("Icon overrides saved.");
  };

  const saveToKv = async () => {
    const token = adminToken.trim();
    if (!token) {
      alert("Admin token is required to save to KV.");
      return;
    }
    try {
      const result = await saveKvOverrides(draft, token);
      window.localStorage.setItem(ICON_ADMIN_TOKEN_KEY, token);
      window.localStorage.setItem(ICON_OVERRIDE_KEY, JSON.stringify(draft));
      setOverrides(draft);
      alert(`Saved to KV. ${result.count} mappings stored.`);
    } catch (error) {
      alert(`KV save failed: ${error.message}`);
    }
  };

  const loadFromKv = async () => {
    try {
      const remote = await fetchKvOverrides();
      setDraft(remote);
      setOverrides(remote);
      window.localStorage.setItem(ICON_OVERRIDE_KEY, JSON.stringify(remote));
      alert("Loaded icon overrides from KV.");
    } catch (error) {
      alert(`KV load failed: ${error.message}`);
    }
  };

  const clearAll = () => {
    window.localStorage.removeItem(ICON_OVERRIDE_KEY);
    setDraft({});
    setOverrides({});
  };

  const importJson = () => {
    try {
      const parsed = JSON.parse(jsonDraft || "{}");
      if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) {
        alert("JSON must be an object map: { \"Tool Name\": \"https://...\" }");
        return;
      }
      const merged = { ...draft, ...parsed };
      setDraft(merged);
      alert("JSON imported into draft. Click Save to apply.");
    } catch {
      alert("Invalid JSON.");
    }
  };

  const exportJson = async () => {
    const text = JSON.stringify(draft, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      alert("JSON copied to clipboard.");
    } catch {
      setJsonDraft(text);
      alert("Could not access clipboard. JSON placed in editor.");
    }
  };

  return (
    <main className="icon-lab">
      <section className="icon-lab-panel">
        <h1>Icon Lab</h1>
        <p>Set favicon URLs per tool. Use full icon URL or favicon endpoint URL. Secret route: <code>{ICON_LAB_HASH}</code></p>
        <div className="icon-lab-actions">
          <button className="button primary" type="button" onClick={save}>Save</button>
          <button className="button secondary" type="button" onClick={loadFromKv}>Load from KV</button>
          <button className="button secondary" type="button" onClick={saveToKv}>Save to KV</button>
          <button className="button secondary" type="button" onClick={clearAll}>Clear</button>
          <button className="button secondary" type="button" onClick={exportJson}>Export JSON</button>
          <button className="button secondary" type="button" onClick={importJson}>Import JSON</button>
          <a className="button secondary" href="#home">Back to site</a>
        </div>
        <input
          className="icon-lab-token"
          type="password"
          value={adminToken}
          onChange={(event) => setAdminToken(event.target.value)}
          placeholder="Admin token for KV write"
        />
        <textarea
          className="icon-lab-json"
          value={jsonDraft}
          onChange={(event) => setJsonDraft(event.target.value)}
          placeholder='Paste JSON map here, e.g. { "OpenAI Codex": "https://.../favicon.ico" }'
        />
        <div className="icon-lab-grid">
          {iconLabTools.map((tool) => (
            <label key={tool} className="icon-lab-row">
              <span>{tool}</span>
              <input
                type="text"
                value={draft[tool] || ""}
                onChange={(event) => setValue(tool, event.target.value)}
                placeholder={toolIconMap[tool]?.src || "https://.../favicon.ico"}
              />
            </label>
          ))}
        </div>
      </section>
    </main>
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
