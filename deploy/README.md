# Azure VM Deployment

This project is set up for a single Linux VM where:

- Nginx serves the Vite frontend from `/var/www/repoxplain/frontend`
- Nginx proxies `/api/*` to the Node backend on `127.0.0.1:5000`
- Jenkins builds and deploys both apps using the root `Jenkinsfile`

## One-time VM setup

1. Copy [repoxplain.conf](./nginx/repoxplain.conf) to `/etc/nginx/sites-available/repoxplain`
2. Enable the site and reload Nginx
3. Create `/opt/repoxplain/backend/.env` from [backend/.env.example](../backend/.env.example)
4. Make sure the Jenkins user can run `sudo` for the deploy directories used in `Jenkinsfile`

## Runtime notes

- The backend is started from `/opt/repoxplain/backend`, not from the Jenkins workspace
- The pipeline preserves `/opt/repoxplain/backend/.env` between deployments
- The health check endpoint is `http://127.0.0.1:5000/api/health`
