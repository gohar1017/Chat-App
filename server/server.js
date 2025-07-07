import express from "express"
import "dotenv/config";
import cors from "cors";
import http from "http"
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userroutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";
import dotenv from 'dotenv';
dotenv.config();


// creating a express app using http server
const app = express();
const server = http.createServer(app);


//initialize socket.io
export const io = new Server(server, {
    cors: { origin: "*" }
})

// Store online users
export const userSocketMap = {};// {userId:socketId}

//socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User connected", userId);

    if (userId) {
        userSocketMap[userId] = socket.id;
    }

    //emit online users to all connected clients.
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    socket.on("disconnect", () => {
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    })

})


// MiddleWare Setup
app.use(express.json({ limit: "4mb" }));
app.use(cors());


//  route setup
app.use("/api/status", (req, res) => res.send("Server is live"));// to check whether our server is running or not.
app.use('/api/auth', userRouter)
app.use('/api/messages', messageRouter)


//connect to MongoDB;
await connectDB();



if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log("Server is running on Port:" + PORT));
}

// export server for vercel.
export default server;