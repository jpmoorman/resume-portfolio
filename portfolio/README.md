# James Moorman Portfolio

React + Vite interactive resume and project portfolio for an executive technical portfolio.

## Local Development

```powershell
npm install
npm run dev
```

## Build

```powershell
npm run build
```

The static production output is generated in `dist/`.

## Project Data

Projects are stored in `src/data/projects.json`. Add or edit entries there. Each project supports:

- `title`
- `category`
- `shortDescription`
- `problem`
- `solution`
- `tools`
- `impact`
- `screenshots`

## Cloudflare Pages Deployment

1. Push this repository to GitHub.
2. In Cloudflare, open **Workers & Pages**.
3. Choose **Create application**.
4. Choose **Pages**.
5. Connect the GitHub repository.
6. Use the Vite framework preset, or enter the settings manually:
   - Root directory: `portfolio`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Deploy command: leave blank
7. Deploy.

The main portfolio is a static Vite site. The optional icon editor uses a Cloudflare Pages Function and KV binding so icon overrides can be saved for all visitors.

## Cloudflare KV for Icon Overrides

This project supports shared icon override storage with Cloudflare KV through `functions/api/icons.js`.

### 1. Create KV namespace

In Cloudflare dashboard:

- Go to **Workers & Pages** -> **KV**
- Create a namespace, for example: `portfolio-icons-kv`

### 2. Bind KV to Pages project

In your Pages project:

- Go to **Settings** -> **Functions** -> **KV namespace bindings**
- Add binding:
  - Variable name: `ICON_KV`
  - KV namespace: `portfolio-icons-kv`

### 3. Add admin token secret

In your Pages project:

- Go to **Settings** -> **Environment variables**
- Add variable:
  - Name: `ICON_ADMIN_TOKEN`
  - Value: a strong random secret string
  - Type: Secret

### 4. Use secret icon page

Open:

`https://<your-domain>/#icon-lab-7f3k`

In Icon Lab:

- Paste admin token in the token field.
- Use **Load from KV** to fetch shared overrides.
- Use **Save to KV** to persist overrides for all visitors.

If KV is unavailable, the app falls back to browser-local `localStorage`.
