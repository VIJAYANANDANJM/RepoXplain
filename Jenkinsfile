pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        FRONTEND_DIR = 'frontend'
        BACKEND_DIR = 'backend'
        FRONTEND_DEPLOY_DIR = '/var/www/repoxplain/frontend'
        BACKEND_DEPLOY_DIR = '/opt/repoxplain/backend'
        BACKEND_HOST = '127.0.0.1'
        BACKEND_PORT = '5000'
        BACKEND_PID_FILE = '/opt/repoxplain/backend/repoxplain.pid'
        BACKEND_LOG_DIR = '/opt/repoxplain/backend/logs'
        BACKEND_LOG_FILE = '/opt/repoxplain/backend/logs/server.log'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo 'Source code checkout complete.'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''#!/usr/bin/env bash
                set -euo pipefail
                cd "$FRONTEND_DIR"
                npm ci --no-audit --no-fund
                '''

                sh '''#!/usr/bin/env bash
                set -euo pipefail
                cd "$BACKEND_DIR"
                npm ci --omit=dev --no-audit --no-fund
                '''
            }
        }

        stage('Build Frontend') {
            steps {
                sh '''#!/usr/bin/env bash
                set -euo pipefail
                cd "$FRONTEND_DIR"
                npm run build
                '''
            }
        }

        stage('Validate Backend') {
            steps {
                sh '''#!/usr/bin/env bash
                set -euo pipefail
                node --check "$BACKEND_DIR/server.js"
                '''
            }
        }

        stage('Deploy Frontend') {
            steps {
                sh '''#!/usr/bin/env bash
                set -euo pipefail

                mkdir -p "$FRONTEND_DEPLOY_DIR"
                find "$FRONTEND_DEPLOY_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
                cp -r "$FRONTEND_DIR/dist"/. "$FRONTEND_DEPLOY_DIR"/
                chmod -R a+rX "$FRONTEND_DEPLOY_DIR"
                '''
            }
        }

        stage('Deploy Backend') {
            steps {
                sh '''#!/usr/bin/env bash
                set -euo pipefail

                mkdir -p "$BACKEND_DEPLOY_DIR" "$BACKEND_LOG_DIR"

                find "$BACKEND_DEPLOY_DIR" -mindepth 1 -maxdepth 1 \
                    ! -name '.env' \
                    ! -name 'logs' \
                    ! -name 'repoxplain.pid' \
                    -exec rm -rf {} +

                cp "$BACKEND_DIR/package.json" "$BACKEND_DEPLOY_DIR/package.json"
                cp "$BACKEND_DIR/package-lock.json" "$BACKEND_DEPLOY_DIR/package-lock.json"
                cp "$BACKEND_DIR/server.js" "$BACKEND_DEPLOY_DIR/server.js"

                cd "$BACKEND_DEPLOY_DIR"
                npm ci --omit=dev --no-audit --no-fund
                '''
            }
        }

        stage('Create Backend Env') {
            steps {
                sh '''#!/usr/bin/env bash
                set -euo pipefail

                cat > "$BACKEND_DEPLOY_DIR/.env" <<EOF
HOST=$BACKEND_HOST
PORT=$BACKEND_PORT
EOF

                chmod 600 "$BACKEND_DEPLOY_DIR/.env"
                '''
            }
        }

        stage('Restart Backend') {
            steps {
                sh '''#!/usr/bin/env bash
                set -euo pipefail

                if [[ -f "$BACKEND_PID_FILE" ]]; then
                    EXISTING_PID="$(cat "$BACKEND_PID_FILE")"
                    if kill -0 "$EXISTING_PID" 2>/dev/null; then
                        kill "$EXISTING_PID"
                        sleep 3
                    fi
                fi

                pkill -f '^repoxplain-backend' || true
                pkill -f 'node server.js' || true

                if command -v lsof >/dev/null 2>&1; then
                    PORT_PID="$(lsof -ti tcp:"$BACKEND_PORT" || true)"
                    if [[ -n "$PORT_PID" ]]; then
                        kill "$PORT_PID" || true
                        sleep 3
                    fi
                elif command -v fuser >/dev/null 2>&1; then
                    fuser -k "${BACKEND_PORT}/tcp" || true
                    sleep 3
                fi

                rm -f "$BACKEND_PID_FILE"

                cd "$BACKEND_DEPLOY_DIR"
                export HOST="$BACKEND_HOST"
                export PORT="$BACKEND_PORT"
                export JENKINS_NODE_COOKIE=dontKillMe

                : > "$BACKEND_LOG_FILE"
                nohup env HOST="$BACKEND_HOST" PORT="$BACKEND_PORT" node server.js >> "$BACKEND_LOG_FILE" 2>&1 &
                echo $! > "$BACKEND_PID_FILE"
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''#!/usr/bin/env bash
                set -euo pipefail

                for attempt in {1..10}; do
                    if curl --silent --fail "http://$BACKEND_HOST:$BACKEND_PORT/api/health" > /dev/null; then
                        echo "Backend health check passed."
                        exit 0
                    fi

                    sleep 3
                done

                echo "Backend health check failed."
                if [[ -f "$BACKEND_LOG_FILE" ]]; then
                    echo "===== Backend log ====="
                    tail -n 100 "$BACKEND_LOG_FILE" || true
                fi

                if [[ -f "$BACKEND_PID_FILE" ]]; then
                    echo "===== Backend PID ====="
                    cat "$BACKEND_PID_FILE" || true
                fi

                echo "===== Process snapshot ====="
                ps -ef | grep node | grep -v grep || true

                exit 1
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline executed successfully. Frontend and backend are live on the VM.'
        }
        failure {
            echo 'Pipeline failed. Check the Jenkins stage logs for the exact step.'
        }
        always {
            cleanWs(cleanWhenNotBuilt: false, deleteDirs: true, disableDeferredWipeout: true)
        }
    }
}
