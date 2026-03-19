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
                // Using cd and reducing npm bloat (--no-audit) prevents small VMs from running Out of Memory
                sh 'cd frontend && npm install --no-audit --no-fund --loglevel=error'
                sh 'cd frontend && npm run build'
            }
        }

        stage('Deploy to VM (Native Node)') {
            steps {
                echo "Deploying the Unified Node.js Server natively..."
                
                sh '''
                cd backend
                npm install --no-audit --no-fund --loglevel=error
                
                # 1. Gracefully securely silence and kill old node backend instances (if any)
                pkill -f 'node server.js' || echo "No previous backend found to kill."
                
                # 2. Start the new backend heavily detached from Jenkins terminal (No Hang Up)
                export JENKINS_NODE_COOKIE=dontKillMe
                nohup node server.js > server.log 2>&1 &
                '''
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
