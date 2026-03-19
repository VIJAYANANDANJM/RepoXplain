# Azure VM Deployment

This project is set up for a single Linux VM where:

- Nginx serves the Vite frontend from `/var/www/repoxplain/frontend`
- Nginx proxies `/api/*` to the Node backend on `127.0.0.1:5000`
- Jenkins builds and deploys both apps using the root `Jenkinsfile`

## One-time VM setup

1. Copy [repoxplain.conf](./nginx/repoxplain.conf) to `/etc/nginx/sites-available/repoxplain`
2. Enable the site and reload Nginx
3. Create the deploy folders once and make Jenkins the owner:

```bash
sudo mkdir -p /var/www/repoxplain/frontend
sudo mkdir -p /opt/repoxplain/backend/logs
sudo chown -R jenkins:jenkins /var/www/repoxplain
sudo chown -R jenkins:jenkins /opt/repoxplain
```

## Runtime notes

- The backend is started from `/opt/repoxplain/backend`, not from the Jenkins workspace
- The pipeline recreates `/opt/repoxplain/backend/.env` on each deployment with only `HOST` and `PORT`
- `GITHUB_TOKEN` is optional and can be added manually later if you want higher GitHub API rate limits
- The health check endpoint is `http://127.0.0.1:5000/api/health`
