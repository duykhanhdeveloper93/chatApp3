pipeline {
    agent any

    environment {
        COMPOSE_FILE = 'docker-compose.yml'
        PROJECT_NAME = 'chatapp'
        BACKEND_DIR = 'backend'
    }

    stages {
        stage('Checkout') {
            steps {
                echo "📥 Lấy source code từ GitHub..."
                git branch: 'main', url: 'https://github.com/duykhanhdeveloper93/chatApp3'
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir("${BACKEND_DIR}") {
                    echo "📦 Cài đặt dependencies cho backend..."
                    sh 'npm install'
                }
            }
        }

        stage('Start Database Services') {
            steps {
                echo "🐳 Khởi động MySQL, Redis, RabbitMQ..."
                sh '''
                    docker compose --project-name ${PROJECT_NAME} up -d mysql redis rabbitmq
                    echo "⏳ Đợi MySQL khởi động..."
                    sleep 20
                '''
            }
        }

        stage('Build Backend Image') {
            steps {
                echo "🛠️ Build Docker image backend (bao gồm generate script)..."
                sh 'docker compose --project-name ${PROJECT_NAME} build backend'
            }
        }

        stage('Generate Migration for New Tables') {
            steps {
                echo "🧠 Kiểm tra từng bảng và generate migration nếu cần..."
                sh """
                    docker compose --project-name ${PROJECT_NAME} up -d backend
                    docker exec -w /app chat-backend sh -c \\
                    "npx ts-node -r tsconfig-paths/register ./src/generate-migration-if-new.ts"
                """
            }
        }

        stage('Run Safe Migrations') {
            steps {
                echo "⚙️ Chạy migration an toàn..."
                sh """
                    docker exec -w /app chat-backend sh -c \\
                    "npx typeorm migration:run -d dist/data-source.js"
                """
            }
        }

        stage('Start All Containers') {
            steps {
                echo "🚀 Khởi động toàn bộ hệ thống..."
                sh 'docker compose --project-name ${PROJECT_NAME} up -d'
            }
        }
    }

    post {
        always {
            echo "🏁 Pipeline hoàn tất."
        }
        success {
            echo "✅ Triển khai thành công toàn bộ hệ thống!"
        }
        failure {
            echo "❌ Triển khai thất bại — kiểm tra log để biết chi tiết."
            sh 'docker compose --project-name ${PROJECT_NAME} down'
        }
    }
}
