import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Database,
  Download,
  Factory,
  FileText,
  Filter,
  Mail,
  Phone,
  ScanLine,
  Server,
  Sparkles,
  Workflow,
} from "lucide-react";
import profile from "./data/profile.json";
import projects from "./data/projects.json";
import "./styles.css";

const DemoHub = React.lazy(() => import("./DemoHub.jsx"));
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
  const [path, setPath] = useState(window.location.pathname || "/");
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
    const onPopState = () => setPath(window.location.pathname || "/");
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
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

  if (path === "/hub") {
    return (
      <>
        <Header />
        <main>
          <HubPage />
        </main>
      </>
    );
  }

  if (path === "/demos/orbit" || path === "/demos/orbit-document-viewer") {
    return (
      <>
        <Header />
        <main>
          <OrbitDemoPage />
        </main>
      </>
    );
  }

  if (path.startsWith("/demos/")) {
    const demoId = path.slice("/demos/".length);
    const project = projects.find((pr) => pr.id === demoId);
    return (
      <>
        <Header />
        <main>
          <DemoPlaceholderPage project={project} demoId={demoId} resolvedToolIcons={resolvedToolIcons} />
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        <Home />
        <DemosOverview />
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
      <a className="brand" href="/#home" aria-label={`${profile.name} home`}>
        <span className="brand-mark">JM</span>
        <span>
          <strong>{profile.name}</strong>
          <small>{profile.targetRole} portfolio</small>
        </span>
      </a>
      <nav className="nav-links" aria-label="Primary navigation">
        <a href="/#home">Home</a>
        <a href="/#projects">Projects</a>
        <a href="/#demos">Demos</a>
        <a href="/#resume">Resume</a>
        <a href="/#skills">Skills</a>
        <a href="/#contact">Contact</a>
      </nav>
      <a className="header-action" href={profile.resumeDownloads?.pdf || profile.resumeDownload} download>
        <Download size={18} aria-hidden="true" />
        Resume PDF
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
          <a className="button secondary" href={profile.resumeDownloads?.pdf || profile.resumeDownload} download>
            <Download size={18} aria-hidden="true" />
            Download resume (PDF)
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
    <article className="project-card" id={`project-${project.id}`}>
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
      <a className="project-demo-link" href={`/demos/${project.id}`}>
        {project.id === "orbit-document-viewer" ? "Open Orbit system demo" : "Open demo page"}
        <ArrowUpRight size={16} aria-hidden="true" />
      </a>
    </article>
  );
}

const orbitExamples = [
  {
    serial: "ASM-20491",
    area: "Assembly",
    family: "Receiver-in-canal",
    product: "Custom demo hearing aid",
    optionCodes: ["ASM", "RIC", "WIRELESS"],
    document: "WI-ASM-1042",
    title: "Assembly work instruction",
    confidence: 96,
    status: "Approved for production",
  },
  {
    serial: "WIRE-11807",
    area: "Wiring",
    family: "Behind-the-ear",
    product: "Custom demo hearing aid",
    optionCodes: ["WIRE", "BTE", "RECHARGE"],
    document: "WI-WIR-2208",
    title: "Wiring and solder verification",
    confidence: 93,
    status: "Approved for production",
  },
  {
    serial: "QA-77210",
    area: "Quality Review",
    family: "In-the-ear",
    product: "Custom demo hearing aid",
    optionCodes: ["QA", "ITE", "FINAL"],
    document: "QMS-CHK-7314",
    title: "Final quality review checklist",
    confidence: 98,
    status: "Controlled source document",
  },
];

function DemosOverview() {
  return (
    <section id="demos" className="section demo-section">
      <div className="section-heading">
        <p className="eyebrow">Interactive demos</p>
        <h2>Six doors. Six demos. Each opens after a quick task.</h2>
        <p>
          Move with W A S D or arrow keys. Walk up to a door, complete the small task in front of
          it, then step through to enter that demo. Returning to the hub always drops you back at
          the center.
        </p>
        <p>
          <a className="button secondary hub-fullscreen-link" href="/hub">Open full-screen hub &nearr;</a>
        </p>
      </div>

      <React.Suspense fallback={<div className="demo-hub-loading">Loading demo room...</div>}>
        <DemoHub />
      </React.Suspense>
    </section>
  );
}

function OrbitDemoPage() {
  return (
    <section className="section demo-section demo-page">
      <div className="section-heading">
        <p className="eyebrow">Interactive demo</p>
        <h1>Orbit system flow, simplified.</h1>
        <p>
          A public-safe walkthrough of the pattern: scan a serial number, resolve the product context,
          match it to controlled documentation, then open the approved viewer.
        </p>
        <a className="button secondary" href="/#demos">
          Back to demos
        </a>
      </div>
      <OrbitDemoInteractive />
    </section>
  );
}

function OrbitDemoInteractive() {
  const [serial, setSerial] = useState(orbitExamples[0].serial);
  const [workArea, setWorkArea] = useState(orbitExamples[0].area);

  const normalizedSerial = serial.trim().toUpperCase();
  const matchedExample =
    orbitExamples.find((example) => example.serial === normalizedSerial && example.area === workArea) ||
    orbitExamples.find((example) => example.area === workArea) ||
    orbitExamples.find((example) => example.serial === normalizedSerial) ||
    orbitExamples[0];

  const result = {
    serial: normalizedSerial || "PENDING-SCAN",
    workArea,
    deviceProfile: {
      product: matchedExample.product,
      family: matchedExample.family,
      optionCodes: matchedExample.optionCodes,
    },
    matchedDocument: {
      documentId: matchedExample.document,
      title: matchedExample.title,
      status: matchedExample.status,
      confidence: `${matchedExample.confidence}%`,
    },
  };

  return (
    <div className="orbit-demo" aria-label="Simplified Orbit system demo">
      <div className="orbit-controls">
        <div>
          <label htmlFor="orbit-serial">Serial number</label>
          <input
            id="orbit-serial"
            value={serial}
            onChange={(event) => setSerial(event.target.value)}
            placeholder="Scan or type a serial"
          />
        </div>
        <div>
          <label htmlFor="orbit-area">Work area</label>
          <select
            id="orbit-area"
            value={workArea}
            onChange={(event) => setWorkArea(event.target.value)}
          >
            {["Assembly", "Wiring", "Quality Review"].map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
        <div className="example-serials" aria-label="Sample serial numbers">
          <span>Sample serial numbers</span>
          {orbitExamples.map((example) => (
            <button
              key={example.serial}
              type="button"
              onClick={() => {
                setSerial(example.serial);
                setWorkArea(example.area);
              }}
            >
              {example.serial}
            </button>
          ))}
        </div>
      </div>

      <div className="orbit-flow" aria-label="System connection diagram">
        <FlowNode icon={ScanLine} title="Web / scanner" detail="Operator enters or scans the serial at a station." />
        <FlowNode icon={Server} title="API layer" detail="Normalizes the request and asks for product context." />
        <FlowNode icon={Database} title="Serial Doc match" detail="Compares family, area, and option codes to controlled rules." />
        <FlowNode icon={FileText} title="Document viewer" detail="Returns the approved source document for the station." />
      </div>

      <div className="orbit-panels">
        <article>
          <h3>API response</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </article>
        <article className="document-preview">
          <h3>Approved viewer preview</h3>
          <span className="doc-status">{result.matchedDocument.status}</span>

          <div className="fake-document" aria-label="Fake approved document preview">
            <header>
              <div>
                <small>Controlled work instruction</small>
                <strong>{result.matchedDocument.documentId}</strong>
              </div>
              <span>Released</span>
            </header>

            <section className="fake-document-title">
              <h4>{result.matchedDocument.title}</h4>
              <p>Sample document generated for portfolio demonstration only.</p>
            </section>

            <dl>
              <div>
                <dt>Serial</dt>
                <dd>{result.serial}</dd>
              </div>
              <div>
                <dt>Work area</dt>
                <dd>{result.workArea}</dd>
              </div>
              <div>
                <dt>Product family</dt>
                <dd>{result.deviceProfile.family}</dd>
              </div>
              <div>
                <dt>Match confidence</dt>
                <dd>{result.matchedDocument.confidence}</dd>
              </div>
            </dl>

            <section className="fake-document-body">
              <h4>Station instructions</h4>
              <ol>
                <li>Confirm the scanned serial number matches the active production traveler.</li>
                <li>Verify the option-code set matches the work area before starting the operation.</li>
                <li>Complete the required checks and record any exception in the workflow system.</li>
              </ol>
            </section>

            <section className="fake-document-body">
              <h4>Matched option codes</h4>
              <div className="option-code-row">
                {result.deviceProfile.optionCodes.map((code) => (
                  <span key={code}>{code}</span>
                ))}
              </div>
            </section>

            <footer>
              <span>Source: approved document library</span>
              <span>Access: read-only viewer</span>
            </footer>
          </div>
        </article>
      </div>
    </div>
  );
}

function FlowNode({ icon: Icon, title, detail }) {
  return (
    <article className="flow-node">
      <span>
        <Icon size={20} aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      <p>{detail}</p>
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
          A formatted web version of the same resume available in PDF, Word, and Markdown.
        </p>
        <a className="button primary" href={profile.resumeDownloads?.pdf || profile.resumeDownload} download>
          <Download size={18} aria-hidden="true" />
          Download PDF
        </a>
        <a className="button secondary" href={profile.resumeDownloads?.docx || profile.resumeDownload} download>Download Word</a>
        <a className="button secondary" href={profile.resumeDownloads?.md || profile.resumeDownload} download>Download Markdown</a>
      </div>

      <div className="resume-preview" aria-label="Print-style resume preview">
        <header>
          <h3>{profile.name}</h3>
          <p>{profile.location} | {profile.phone} | {profile.email} | Portfolio: jimmyjames.dev</p>
        </header>

        <section>
          <h4>Professional Summary</h4>
          <p>
            AI workflow engineer and internal tools builder with experience designing, shipping, and scaling AI-enabled workflows across CRM-adjacent processes, operational data, document systems, and internal web applications. Hands-on with React, Python, SQL, APIs, LLM-assisted development, prompt frameworks, and automation patterns. Strong record of moving ambiguous business needs from prototype to production, measuring adoption and impact, and creating reusable patterns that reduce manual work across distributed teams.
          </p>
          <p>
            Career foundation spans engineering, product/program management, and operations technology, giving me the context to translate ambiguous business workflows into production internal tools.
          </p>
        </section>

        <section>
          <h4>Core Skills</h4>
          <ul>
            <li>AI Workflow Engineering: LLM-assisted development, prompt frameworks, agent-style workflows, AI quality checks, reusable automation patterns</li>
            <li>Internal Tools: React, Python, APIs, SQL, dashboards, workflow applications, validation logic</li>
            <li>GTM / CRM Systems: Salesforce-adjacent workflows, CRM-connected processes, order workflows, reporting automation, adoption tracking</li>
            <li>Data Platforms: SQL, Microsoft Dataverse, Azure Cosmos DB, Microsoft Fabric concepts, Power BI, Power Platform</li>
            <li>Execution: Stakeholder discovery, prototype-to-production delivery, rollout planning, executive reporting, business-impact measurement</li>
          </ul>
        </section>

        <section>
          <h4>Best Fit for Sales AI Engineering</h4>
          <ul>
            <li>Built internal workflow tools that reduced manual execution across sales-adjacent, operations, quality, warehouse, and document-control processes.</li>
            <li>Connected fragmented systems using APIs, SQL, Python, React, Power Platform, Dataverse, Cosmos DB, and custom web tools.</li>
            <li>Used AI-assisted development tools including OpenAI Codex, Claude Code, OpenCode, Windsurf, and GitHub Copilot to accelerate prototype-to-production delivery.</li>
            <li>Created reusable implementation patterns for internal tools, dashboards, validation logic, and workflow automation.</li>
            <li>Measured business impact through adoption, accuracy, throughput, cycle time, cost reduction, and executive-level operating metrics.</li>
          </ul>
        </section>

        <section>
          <h4>Professional Experience</h4>
          <article>
            <p className="role-line"><strong>Starkey Laboratories</strong> | Senior Manager, AI Workflow Engineering and Internal Tools | 09/2022 - Present</p>
            <ul>
              <li>Designed and shipped AI-enabled internal tools, workflow automations, dashboards, and system integrations across commercial operations, manufacturing, quality, distribution, and program execution.</li>
              <li>Built React and Python applications that connected CRM-connected workflows, warehouse systems, document-control systems, SQL, Dataverse, Cosmos DB, APIs, and custom operational tools.</li>
              <li>Applied LLM-assisted development workflows using OpenAI Codex, Claude Code, OpenCode, Windsurf, and GitHub Copilot to accelerate internal software delivery.</li>
              <li>Improved order accuracy from 97% to 99.7%, increased shipment capacity from 1,800 to 4,200 shipments per day, and reduced annual overhead costs by $2.2M.</li>
              <li>Reduced documentation cycle time from 8 weeks to 4 weeks and reduced annual packaging and shipping expenditures by approximately $1.7M.</li>
            </ul>
          </article>
          <article>
            <p className="role-line"><strong>Monteris Medical</strong> | Senior Engineer / Documentation Systems Lead | 12/2020 - 08/2022</p>
            <ul>
              <li>Led development, verification, validation, and launch of a new MRI-compatible product for shallow tumor treatment within 18 months.</li>
              <li>Built a MediaWiki-based documentation control system to move static engineering and quality documents into a controlled, searchable platform.</li>
              <li>Supported launch generating approximately $25K in weekly revenue and 2,600 units sold in the first year.</li>
            </ul>
          </article>
          <article>
            <p className="role-line"><strong>Donaldson</strong> | Product Manager | 02/2018 - 12/2020</p>
            <ul>
              <li>Supported major enterprise customers through product development and strategic planning.</li>
              <li>Built new revenue pipelines during the pandemic through market and network execution.</li>
            </ul>
          </article>
        </section>

        <section>
          <h4>Representative Systems Delivered</h4>
          <ul>
            <li>CRM-adjacent workflow tooling: Built workflow tools that connected order, customer, fulfillment, and reporting processes outside the core CRM system.</li>
            <li>Warehouse execution dashboards: Integrated pick, routing, correction, and fulfillment workflows to improve order accuracy and shipment throughput.</li>
            <li>Controlled document viewer: Built a controlled-access web viewer for approved production documents, reducing licensing friction and improving source-document access.</li>
            <li>Leadership reporting automation: Built Power Platform and Dataverse tools that automated project and program reporting for executive updates.</li>
          </ul>
        </section>

        <section>
          <h4>Technical Skills and Tools</h4>
          <ul>
            <li>AI and Developer Tools: OpenAI Codex, Claude Code, OpenCode, Windsurf, GitHub Copilot, prompt frameworks, agent-style workflows, LLM quality checks</li>
            <li>Languages and Frameworks: Python, React, SQL</li>
            <li>Platforms and Data: Azure, Azure Cosmos DB, Microsoft Dataverse, Microsoft Fabric concepts, Power Platform, Power BI</li>
            <li>Automation and Workflow: Power Apps, Power Automate, n8n, Copilot Studio, Codex routines, approval workflows, document review support, reporting automation, workflow tracking</li>
          </ul>
          <div className="resume-tool-icons" aria-label="Primary AI tool stack">
            <ToolBadge text="OpenAI Codex" resolvedToolIcons={resolvedToolIcons} />
            <ToolBadge text="Claude Code" resolvedToolIcons={resolvedToolIcons} />
            <ToolBadge text="Windsurf" resolvedToolIcons={resolvedToolIcons} />
            <ToolBadge text="OpenCode" resolvedToolIcons={resolvedToolIcons} />
            <ToolBadge text="Microsoft Fabric" resolvedToolIcons={resolvedToolIcons} />
          </div>
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
  const previewIcons = useMemo(() => {
    const next = { ...toolIconMap };
    for (const [name, value] of Object.entries(draft)) {
      if (!value) continue;
      const existing = next[name] || { alt: `${name} icon`, className: "custom" };
      next[name] = { ...existing, src: value };
    }
    return next;
  }, [draft]);

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
              <span className="icon-lab-tool-name">
                <img
                  src={previewIcons[tool]?.src || toolIconMap[tool]?.src || favicon("example.com")}
                  alt={previewIcons[tool]?.alt || `${tool} icon`}
                />
                {tool}
              </span>
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


function DemoPlaceholderPage({ project, demoId, resolvedToolIcons }) {
  if (!project) {
    return (
      <section className="section demo-section demo-page">
        <div className="section-heading">
          <p className="eyebrow">Demo not found</p>
          <h1>That demo doesn\'t exist yet.</h1>
          <p>
            We couldn\'t find a project matching <code>{demoId}</code>. Head back to the demo hub
            and try another door.
          </p>
          <a className="button secondary" href="/#demos">Back to demos</a>
        </div>
      </section>
    );
  }
  return (
    <section className="section demo-section demo-page">
      <div className="section-heading">
        <p className="eyebrow">Interactive demo &middot; coming soon</p>
        <h1>{project.title}</h1>
        <p>{project.shortDescription}</p>
        <a className="button secondary" href="/#demos">&larr; Back to demos</a>
      </div>

      <div className="demo-placeholder">
        <div className="demo-placeholder-banner">
          <div>
            <small>Status</small>
            <strong>Live walkthrough in progress</strong>
            <p>
              The Orbit demo is fully interactive at <a href="/demos/orbit-document-viewer">/demos/orbit-document-viewer</a>.
              This page is a stand-in for the {project.title} interactive demo while it\'s being built. Below is a public-safe
              summary of the work and outcomes.
            </p>
          </div>
        </div>

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
            <ToolBadge key={tool} text={tool} resolvedToolIcons={resolvedToolIcons || {}} />
          ))}
        </div>

        <div className="impact-list">
          <h4>Impact</h4>
          <ul>
            {project.impact.map((imp) => (<li key={imp}>{imp}</li>))}
          </ul>
        </div>

        <a className="button primary" href="/#demos">Return to demo hub</a>
      </div>
    </section>
  );
}


function HubPage() {
  return (
    <section className="section demo-section hub-page">
      <div className="hub-page-heading">
        <p className="eyebrow">Interactive demo hub</p>
        <h1>Six doors. Six demos.</h1>
        <p>
          Move with W A S D / arrows or use the chat to tell the sprite what to do.
          <a className="hub-page-back" href="/#home"> &larr; Back to home</a>
        </p>
      </div>
      <React.Suspense fallback={<div className="demo-hub-loading">Loading demo room…</div>}>
        <DemoHub />
      </React.Suspense>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
