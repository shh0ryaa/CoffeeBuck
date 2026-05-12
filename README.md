# CoffeBuck — OpenRouter proxy + Chatbot

This small Node.js proxy forwards chat requests from the website to OpenRouter so your API key is kept on the server.

Files added:
- `server.js` — Express server that exposes `POST /api/chat` and serves the static site files.
- `package.json` — dependencies and start scripts.
- `.env.example` — example environment file.

Quick start (Windows PowerShell)

1. Install Node.js (v16+ recommended).
2. From the project root run:

```powershell
npm install
```

3. Create a `.env` file in the project root (copy `.env.example`) and set your OpenRouter API key:

```powershell
copy .env.example .env
# then edit .env and put your key after OPENROUTER_API_KEY=
```

4. Start the server (serves the static site and proxy on port 3000):

```powershell
npm start
```

5. Open the site in your browser:

http://localhost:3000/index.html

Notes
- The client code prefers calling the proxy at `/api/chat`. If the proxy is not available, the client will fall back to a direct call to the OpenRouter API only if you paste your API key into `assets/js/main.js` (not recommended for production).
- For development you can use `npm run dev` if you want nodemon auto-restart.

Security recommendation
- Keep your API key in the server environment only (in `.env` or your host's secret manager). Do not commit `.env` to version control.

Publishing the static site on GitHub (GitHub Pages)

1. Create a new GitHub repository (e.g., `coffebuck-site`) on github.com.
2. In your project root, initialize git, add files, and push:

```powershell
git init
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
git add .
git commit -m "Initial site + proxy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

3. Enable GitHub Pages for the repository:
	 - Go to your repo on GitHub → Settings → Pages.
	 - Under "Build and deployment", choose "Source: Deploy from a branch" and select the `main` branch and the `/ (root)` folder.
	 - Save — GitHub will publish the static files (index.html and assets) to a `github.io` URL in a few minutes.

Notes about the proxy/back-end
- GitHub Pages only serves static content (HTML/CSS/JS). The Node.js `server.js` proxy cannot run on GitHub Pages.
- Host the proxy (the `server.js` Node app) separately — recommended hosts: Render, Railway, Fly, Vercel (serverless function), or Heroku.
- Once you deploy the proxy to a public URL (for example `https://api.yoursite.com/api/chat`), update the client if needed:
	- If you keep the same origin (serve static site from the same host as the proxy), client works as-is.
	- If the proxy is on a different origin, either set `fetch('/api/chat', ...)` to the full URL or create a small rewrite/CORS rule. The client already first tries `/api/chat` (same origin) and falls back to direct OpenRouter call; you can replace the proxy URL in the client for cross-origin.

Example: Deploy proxy to Render and set `PROXY_URL` to `https://your-render-service.onrender.com/api/chat`, then update `assets/js/main.js` to call that endpoint instead of `/api/chat`.

If you want, I can generate a small `deploy.md` with step-by-step instructions for Render or Railway and the exact client change to point to the hosted proxy.
