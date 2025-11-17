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
                git branch: 'main',
                    url: 'https://github.com/duykhanhdeveloper93/chatApp3'
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

        stage('Generate Migration for New Tables') {
            steps {
                dir("${BACKEND_DIR}") {
                    echo "🧠 Kiểm tra từng bảng và generate migration nếu cần..."
                    sh '''
                        # Load .env
                        export $(grep -v '^#' .env | xargs)
                        
                        # Chạy script Node để generate migration cho bảng mới
                        docker exec chat-backend sh -c "npx ts-node -r tsconfig-paths/register ./src/generate-migration-if-new.ts"
                    '''
                }
            }
        }

        stage('Build & Deploy Containers') {
            steps {
                echo "🚀 Build & khởi động backend..."
                sh '''
                    docker compose --project-name ${PROJECT_NAME} up -d --build
                '''
            }
        }

        stage('Run Safe Migrations') {
            steps {
                echo "⚙️ Chạy tất cả migration còn chưa chạy..."
                dir("${BACKEND_DIR}") {
                    sh '''
                        docker exec chat-backend sh -c "npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d src/data-source.ts"
                    '''
                }
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
            sh '''
                echo "🧹 Dừng các container lỗi..."
                docker compose --project-name ${PROJECT_NAME} down
            '''
        }
    }
}
