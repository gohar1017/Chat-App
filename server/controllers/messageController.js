

// get all users except the logged in users

import Message from "../models/Message.js";
import User from "../models/user.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";


export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password");

        // count the number of unseen messages.

        const unseenMessages = {}
        const promises = filteredUsers.map(async (user) => {
            const messages = await Message.find({ senderId: user._id, receiverId: userId, seen: false })
            if (messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }

        })
        await Promise.all(promises);
        res.json({ success: true, users: filteredUsers, unseenMessages });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// get all message from selected Users.


export const getMessages = async (req, res) => {
    try {

        const { id: selectedUserId } = req.params;
        const myId = req.user._id;
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ]
        })
        // mark messages as read
        await Message.updateMany({ senderId: selectedUserId, receiverId: myId }, { seen: true });
        res.json({ success: true, messages })

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// api to mark message as seen using messageId

export const markMessageAsSeen = async (req, res) => {
    try {

        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { seen: true });
        res.json({ success: true });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// send message to selected user

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let image_Url;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            image_Url = uploadResponse.secure_url;
        }
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: image_Url
        })
        // Emit the new message to the receiver's socket.
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.json({ success: true, newMessage });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });

    }
}
