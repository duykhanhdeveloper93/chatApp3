const { io } = require("socket.io-client");

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzYTA2MjgwYy04NmM3LTQ2ZWEtOGFiYy0yZmNmZDIwODAzN2IiLCJlbWFpbCI6ImFkbWluVG9pVGh1b25nQGV4YW1wbGUuY29tIiwidXNlcm5hbWUiOiJhZG1pblRvaVRodW9uZyIsInBlcm1pc3Npb25zIjpbImNoYXQuY3JlYXRlIl0sImlhdCI6MTc1Njk3NTA2NCwiZXhwIjoxNzU3NTc5ODY0fQ.WjFpnCoD42cTbZKWkwCHGAM3aaQ5HrwkT5nTbR0nfog";
const chatRoomId = "9f706e18-52b0-4256-a9e8-1b6208506e7a";

const socket = io("http://localhost:3000/chat", {
  transports: ["websocket"],
  auth: { token },
});

socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);

  // Join room
  socket.emit("join:room", { chatRoomId }, (res) => {
    console.log("➡️ Join room response:", res);

    // Nếu join ok thì gửi tin nhắn
    if (res.success) {
      setTimeout(() => {
        socket.emit(
          "send:message",
          { chatRoomId, content: "Hello anh em 👋" },
          (sendRes) => {
            console.log("➡️ Send message response:", sendRes);
          }
        );
      }, 1000);
    }
  });
});

socket.on("message:new", (msg) => {
  console.log("💬 New message:", msg);
});
