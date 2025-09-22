pipeline {
    agent any

    environment {
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'
    }

    stages {
        

       stage('Build & Deploy Docker') {
            steps {
                echo 'Stop existing containers if any'
                sh "docker-compose -p chatapp -f ${DOCKER_COMPOSE_FILE} down --volumes --remove-orphans"

                echo 'Build and start containers'
                sh "docker-compose -p chatapp -f ${DOCKER_COMPOSE_FILE} up -d --build"
            }
        }

    }

    post {
        success {
            echo "Deployment successful!"
        }
        failure {
            echo "Deployment failed!"
        }
    }
}
