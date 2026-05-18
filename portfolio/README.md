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
6. Set the project root directory to `portfolio`.
7. Set the build command to `npm run build`.
8. Set the build output directory to `dist`.
9. Deploy.

No backend, serverless functions, or environment variables are required.
