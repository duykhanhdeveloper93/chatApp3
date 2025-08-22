#!/bin/bash

# Development script for Chat App
echo "🔧 Starting Chat Application in Development Mode..."

# Start only infrastructure services
echo "📦 Starting infrastructure services..."
docker-compose -f docker-compose.dev.yml up -d

echo "✅ Development infrastructure is ready!"
echo ""
echo "📊 MySQL Dev: localhost:3307 (chat_user/chat_password)"
echo "🔴 Redis Dev: localhost:6380"
echo "🐰 RabbitMQ Dev: http://localhost:15673 (chat_user/chat_password)"
echo ""
echo "Now you can run your backend and frontend locally:"
echo "Backend: cd backend && npm run start:dev"
echo "Frontend: cd frontend && ng serve"
