import { createContext } from "react";
import axios from "axios"
import { useState } from "react";
import toast from "react-hot-toast";
import { useEffect } from "react";
import {io} from "socket.io-client" 

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({children})=>{

    const [token,setToken] = useState(localStorage.getItem("token"));
    const[authUser,setAuthUser] = useState(null);
    const[onlineUsers,setOnlineUsers] = useState([]);
    const[socket,setSocket] = useState(null);

    // check if user is authenticated if so, set the user data and connect the socket
    const checkAuth = async()=>{
        try {
            const {data}=await axios.get("/api/auth/check");
            if(data.success)
            {
                setAuthUser(data.user);
                connectSocket(data.user);
            }

        } catch (error) {
            toast.error(error.message);
            
        }
    }
    // login function to handle user authentication and socket connection.
    const login = async(state,credentials)=>{
        try {
            const {data} = await axios.post(`/api/auth/${state}`,credentials);

            if(data.success)
            {
                setAuthUser(data.userData); 
                connectSocket(data.userData);
                axios.defaults.headers.common["token"] = data.token;
                setToken(data.token);
                localStorage.setItem("token",data.token);
                toast.success(data.message);
            }
            else{
                toast.success(data.message);
            }
            
        } catch (error) {
            toast.error(error.message);
        }
    }   

    // logout function to handle user and socket disconnection
    const logout = ()=>{
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        axios.defaults.headers.common["token"] = null;
        toast.success("Logged out successfully");
        if (socket) {
            socket.disconnect();
        }
    }

    //update profile function to handle user profile.
    const updateProfile = async(body)=>{
        try {
            const {data} = await axios.put("/api/auth/update-profile",body);
            if(data.success){
                setAuthUser(data.user);
            }
            return data;
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // connect socket function to handle socket connection and online user updates.
    const connectSocket = (userData)=>{
        if(!userData){
            return;
        }
        
        // Disconnect existing socket if connected
        if(socket?.connected){
            socket.disconnect();
        }
        
        const newSocket = io(backendUrl,{
            query:{
                userId:userData._id,
            }
        })
        newSocket.connect();
        setSocket(newSocket);
        newSocket.on("getOnlineUsers",(userIds)=>{
            setOnlineUsers(userIds);
        })
    }
    useEffect(()=>{
        if(token)
        {
            axios.defaults.headers.common["token"] = token; 
        }
        checkAuth();

    },[])
    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile
    }

    return(
        <AuthContext.Provider value = {value}>
            {children}
        </AuthContext.Provider>
    )

}