pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                // Jenkins will automatically checkout the code if configured via SCM (e.g. GitHub Webhooks)
                checkout scm
                echo "Source code checkout complete."
            }
        } 
        stage('Test Pipeline Connection') {
            steps {
                // A simple test to verify Jenkins is correctly running on the VM
                echo "Jenkins pipeline is successfully connected and running on the VM!"
                sh 'echo "Current working directory is \$(pwd)"'
                sh 'echo "Current user is \$(whoami)"'
            }
        }

        stage('Testing Environment') {
            steps {
                // Add your testing steps here (e.g., unit tests, linting)
                echo "Running application tests..."
                
                // Examples depend on your tech stack: 
                // sh 'npm test'       // For Node.js
                // sh 'pytest'         // For Python
                // sh 'mvn test'       // For Java/Maven
                // sh 'go test ./...'  // For Go
            }
        }

        stage('Build') {
            steps {
                echo "Building the frontend application..."
                sh 'npm install --prefix frontend'
                sh 'npm run build --prefix frontend'
            }
        }

        stage('Deploy to VM (Nginx + PM2)') {
            steps {
                echo "Deploying to the VM..."
                
                // 1. Deploy Frontend to NGINX
                // (Assuming user jenkins has permissions to write to /var/www/html or uses sudo)
                // Vite builds to the "dist" directory by default
                sh 'sudo cp -r frontend/dist/* /var/www/html/'
                sh 'sudo systemctl reload nginx'

                // 2. Deploy Backend using PM2
                // We cd into the backend directory so that .env and modules resolve correctly.
                sh 'cd backend && npm install'
                sh 'cd backend && pm2 restart repo-backend || pm2 start server.js --name repo-backend'
                sh 'pm2 save'
            }
        }
    }

    post {
        always {
            echo "Cleaning up workspace..."
            cleanWs() // Cleans the workspace after execution
        }
        success {
            echo "✅ Pipeline executed successfully! The deployment is complete."
        }
        failure {
            echo "❌ Pipeline failed! Please check the Jenkins logs."
        }
    }
}
