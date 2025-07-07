import express from "express"
import { checkAuth, login, signup, updateProfile } from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";
const userRouter = express.Router();//creates a new user router and in this we can create new routes.


// These are all four API endpoints for the user.

userRouter.post('/signup', signup)
userRouter.post('/login', login)
userRouter.put('/update-profile', protectRoute, updateProfile)
userRouter.get('/check', protectRoute, checkAuth)

export default userRouter