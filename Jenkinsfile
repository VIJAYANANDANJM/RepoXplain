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
                // Build your project artifacts or Docker images
                echo "Building the application..."
                
                // Examples:
                // sh 'npm run build'
                // sh 'docker build -t my-app:latest .'
            }
        }

        stage('Deploy to VM') {
            steps {
                // The actual deployment steps
                echo "Deploying to the VM..."
                
                // Since Jenkins is ON the VM, you can run commands directly, or use Docker
                // Examples:
                // sh 'docker run -d -p 80:80 my-app:latest'
                // sh 'systemctl restart my-service'
                // sh 'cp -r build/* /var/www/html/'
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
