const express = require("express");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const http = require("http"); // Required for Socket.IO to work with Express
const { Server } = require("socket.io"); // Socket.IO
const chatRouter = require("./routes/chatRouter");
const { storeMessageInDB } = require("./services/uploadMessages"); // Import the DB function
const verifyJWT = require("./jwtMiddleware");

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
app.get("/", (req, res) =>
  res.json({ message: "Welcome to Tiffin Box Chat Server" })
);

// Online users map
const usersOnline = {}; // Maps userId to socketId

// WebSocket logic
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join", ({ jwtToken }) => {
    const user = verifyJwt(jwtToken);
    if (!user) {
      console.error("Invalid token during join event.");
      return;
    }

    const { customerId, vendorId } = user; // Extract user details from token
    const userId = customerId || vendorId; // Determine the user's ID
    console.log(`${userId} has joined the chat`);

    usersOnline[userId] = socket.id; // Map userId to socketId
    socket.join(userId); // Join a room named after the user's ID
  });

  // Handle sending messages
  socket.on(
    "send_message",
    async ({ jwtToken, message, isCustomer, recipientId }) => {
      const user = verifyJWT(jwtToken);
      if (!user) {
        console.error("Invalid token during send_message event.");
        return;
      }

      const senderId = user.customerId || user.vendorId; // Extract sender's ID from token

      console.log(`Message from ${senderId} to ${recipientId}: ${message}`);

      // Check if recipient is online
      const recipientSocketId = usersOnline[recipientId];
      if (recipientSocketId) {
        // Recipient is online; send message directly
        io.to(recipientSocketId).emit("receive_message", {
          senderId,
          message,
        });
        console.log(`Message sent to ${recipientId}: ${message}`);
      } else {
        // Recipient is offline; store the message in the database
        console.log(
          `Recipient ${recipientId} is offline. Storing message in DB.`
        );
        try {
          await storeMessageInDB(senderId, recipientId, message, isCustomer);
        } catch (err) {
          console.error("Error storing message in DB:", err);
        }
      }
    }
  );

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    for (const [userId, socketId] of Object.entries(usersOnline)) {
      if (socketId === socket.id) {
        delete usersOnline[userId];
        console.log(`${userId} has disconnected`);
        break;
      }
    }
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const verifyJwt = (token) => {
  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      // Log the error for debugging purposes
      console.error("Token verification error: ", err);
      return res
        .status(errorCodes.FORBIDDEN.status)
        .json({ message: errorCodes.FORBIDDEN.message });
    }
    return decoded;
  });
};
