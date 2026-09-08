pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Tests') {
            steps {
                script {
                    def services = ['api-gateway', 'discovery-service', 'media-service', 'product-service', 'security-service', 'user-service']
                    services.each { svc ->
                        dir("backend/${svc}") {
                            sh './mvnw clean test'
                        }
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                dir('backend') {
                    sh 'docker compose build'
                }
            }
        }

        stage('Frontend Tests') {
            steps {
                dir('frontend') {

                    sh 'npm ci'

                    sh 'npm test'
                }
            }
        }


        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Deploy Backend') {
            when {
                branch 'main'
            }
            steps {
                dir('backend') {
                    script {
                        try {
                            sh 'docker compose up -d'
                        } catch (err) {
                            sh 'docker compose down'
                            sh 'docker compose -f docker-compose.previous.yml up -d'
                            error("Déploiement backend échoué — rollback exécuté")
                        }
                    }
                }
            }
        }

        stage('Deploy Frontend') {
            when {
                branch 'main'
            }
            steps {
                dir('frontend') {
                    sh '''
                        pkill -f "ng serve" || true
                        nohup npx ng serve --ssl --host 0.0.0.0 > ng-serve.log 2>&1 &
                        sleep 5
                    '''
                }
            }
        }

    }

    post {
        success {
            echo "✅ Build réussi"
        }
        failure {
            echo "❌ Build échoué"
        }
    }
}