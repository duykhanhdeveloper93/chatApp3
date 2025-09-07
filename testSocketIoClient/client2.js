// client2.js
const { io } = require("socket.io-client")
const readline = require("readline") // để đọc input từ terminal

const SERVER_URL = "http://localhost:3000/chat"
const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNjNkMjA0MC01OTczLTRmODgtODIwMi04YWFjZTZjYTdiZTYiLCJlbWFpbCI6ImhhY2hvY2FAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6ImhhY2hvY2EiLCJwZXJtaXNzaW9ucyI6W10sImlhdCI6MTc1Njk3NTg3MCwiZXhwIjoxNzU3NTgwNjcwfQ.GC3mmehHu53MzM_plmvvd_pYrxieq6wMJ4D9XlhXEAY"
const ROOM_ID = "9f706e18-52b0-4256-a9e8-1b6208506e7a"

const socket = io(SERVER_URL, {
  auth: { token: TOKEN },
})

// tạo readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'Message> '
})

socket.on("connect", () => {
  console.log("✅ Client2 Connected:", socket.id)

  // join room
  socket.emit("join:room", { chatRoomId: ROOM_ID }, (response) => {
    console.log("➡️ Join room response:", response)
    rl.prompt() // bắt đầu prompt sau khi join
  })
})

// hứng tin nhắn mới
socket.on("send:message:read", (msg) => {
  console.log(`\n💬 [${msg.sender.username}]: ${msg.content}`)
  rl.prompt() // hiện prompt lại sau khi có tin nhắn mới
})

// gửi tin nhắn khi user nhập vào terminal
rl.on('line', (line) => {
  const content = line.trim()
  if (content) {
    socket.emit("send:message", { chatRoomId: ROOM_ID, content })
  }
  rl.prompt()
})

socket.on("disconnect", () => {
  console.log("❌ Client2 Disconnected")
})
