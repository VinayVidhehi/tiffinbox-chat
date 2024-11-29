const express = require("express");
const http = require("http"); // Required for Socket.IO to work with Express
const { Server } = require("socket.io"); // Socket.IO
const chatRouter = require("./routes/chatRouter");
const { storeMessageInDB } = require("./services/uploadMessages"); // Import the DB function

const app = express();
const PORT = 4000;

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO to the server
const io = new Server(server, { cors: { origin: "*" } }); // Allow CORS for development

// Middleware to parse JSON data
app.use(express.json());

// Use the auth routes
app.use("/auth/chat", chatRouter);

// Root route
app.get("/", (req, res) => res.json({ message: "Welcome to Tiffin Box Chat Server" }));

// Online users map
const usersOnline = {};  // Maps userId to socketId

// WebSocket logic
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Listen for "join" events (when a user logs in or joins chat)
  socket.on("join", ({ userId }) => {
    console.log(`${userId} has joined the chat`);
    usersOnline[userId] = socket.id; // Map userId to socketId
    socket.join(userId); // Join a room named after the user's ID
  });

  // Handle sending messages
  socket.on("send_message", async ({ senderId, recipientId, message }) => {
    console.log(`Message from ${senderId} to ${recipientId}: ${message}`);
    
    // Check if recipient is online
    const recipientSocketId = usersOnline[recipientId];

    if (recipientSocketId) {
      // If recipient is online, send the message directly
      io.to(recipientSocketId).emit("receive_message", { senderId, message });
      console.log(`Message sent to ${recipientId}: ${message}`);
    } else {
      // If recipient is offline, store the message in DB for later delivery
      console.log(`Recipient ${recipientId} is offline. Storing message in DB.`);
      try {
        await storeMessageInDB(senderId, recipientId, message); // Call DB service to store the message
      } catch (err) {
        console.error('Error storing message in DB:', err);
      }
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    for (const userId in usersOnline) {
      if (usersOnline[userId] === socket.id) {
        delete usersOnline[userId];  // Remove user from online users list
        console.log(`${userId} disconnected`);
        break;
      }
    }
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
