pipeline {
    agent any

    environment {
        COMPOSE_FILE = 'docker-compose.yml'
        PROJECT_NAME = 'chatapp' // tên chung cho các container, tránh trùng
        DOCKER_BUILDKIT = '1'    // bật BuildKit để build nhanh + cache tốt hơn
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/duykhanhdeveloper93/chatApp3'
            }
        }

        stage('Build Backend & Frontend') {
            steps {
                sh '''
                    echo "⚙️ Building Docker images with cache..."
                    docker-compose -p $PROJECT_NAME -f $COMPOSE_FILE build
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    echo "🧹 Cleaning old containers..."
                    # Dừng và xóa orphan containers nếu có
                    docker-compose -p $PROJECT_NAME -f $COMPOSE_FILE down --remove-orphans || true

                    # Xóa container trùng tên nếu còn sót (an toàn)
                    docker ps -a --filter "name=${PROJECT_NAME}" -q | xargs -r docker rm -f || true
                    docker ps -a --filter "name=chat-" -q | xargs -r docker rm -f || true

                    echo "🚀 Starting services..."
                    docker-compose -p $PROJECT_NAME -f $COMPOSE_FILE up -d
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Deployment successful!'
        }
        failure {
            echo '❌ Deployment failed!'
        }
    }
}
