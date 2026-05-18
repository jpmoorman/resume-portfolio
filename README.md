# Resume and Project Tracker

This repository tracks resume materials, job applications, and project evidence over time.

## Structure

- `resume/` - master resume source and targeted resume drafts.
- `projects/` - project history, evidence, metrics, and reusable accomplishment notes.
- `applications/` - role-specific job notes, tailoring plans, and application drafts.
- `portfolio/` - static portfolio/demo site for showing shipped internal tools and project evidence.

## Current Target

- Figma - Sales AI Engineer

## Portfolio

The portfolio is a React + Vite static site in `portfolio/`.

Local development:

```powershell
cd portfolio
npm install
npm run dev
```

Cloudflare Pages settings:

- Root directory: `portfolio`
- Build command: `npm run build`
- Build output directory: `dist`
- Backend: none required
