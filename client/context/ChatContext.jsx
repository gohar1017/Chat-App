import { useContext } from "react";
import { createContext, useState } from "react";
import {AuthContext} from "./AuthContext"
import toast from "react-hot-toast";
import { useEffect } from "react";

export const ChatContext = createContext();
export const ChatProvider = ({children})=>{

    const [messages,setMessages] = useState([]);
    const [users,setUsers] = useState([]);
    const [selectedUser,setSelectedUser] = useState(null);
    const [unseenMessages,setUnseenMessages] = useState({});

    const{socket,axios} = useContext(AuthContext);

    // Function to get all users for sidebar

    const getUsers = async()=>{
        try {
            const{data}=await axios.get("/api/messages/users");
            if(data.success)
            {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to fetch users");
        }
    }


// Function to get messages for the selected users
const getMessages = async(userId)=>{
    try {
        const {data} = await axios.get(`/api/messages/${userId}`);
        if(data.success){
            setMessages(data.messages)
        }
        
    } catch (error) {
        toast.error(error.messages);
    }
}


// Function to send message to selected users
const sendMessage = async(messageData)=>{
    try {
        const {data} = await axios.post(`/api/messages/send/${selectedUser._id}`,messageData);
        if(data.success)
        {
            setMessages((preMessages)=>[...preMessages,data.newMessage])
        }else{
            toast.error(data.message);
        }
        
    } catch (error) {
        toast.error(error.message);
    }
}


// Function to subscribe to message for selected user
  const subscribeToMessages = async()=>{
    if(!socket){
        return;
    }
    else{
        socket.on("newMessage",(newMessage)=>{
            if(selectedUser && newMessage.senderId===selectedUser._id){
                newMessage.seen = true; 
                setMessages((preMessages)=>[...preMessages,newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);
            }
            else{
                setUnseenMessages((prevUnseenMessages)=>({
                    ...prevUnseenMessages,[newMessage.senderId]:prevUnseenMessages[newMessage.senderId]
                    ?prevUnseenMessages[newMessage.senderId] + 1: 1
                }))
            }
        });
    }
  }
  // Function to unsubscribe from messages
  const unsubscribeFromMessages = ()=>{
    if(socket){
        socket.off("newMessage");
    }
  }
  useEffect(()=>{
    subscribeToMessages(); 
    return()=>unsubscribeFromMessages(); 
  },[socket,selectedUser])


    const value = {
        messages,
        users,
        selectedUser,
        getUsers,
        getMessages,
        sendMessage,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
    }

    return(
   <ChatContext.Provider value = {value}>
    {children}
  </ChatContext.Provider>
    ) 

}