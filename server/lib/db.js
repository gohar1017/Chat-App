import mongoose from "mongoose";

// Below is the function to connect to the mongoDB

export const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log("Database Connected"))
        await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`)

    } catch (error) {

        console.log(error);

    }
}