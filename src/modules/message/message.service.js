import { Message } from "../DB/models/message.model.js"
import { messages } from "../utilities/messages/index.js";
import UserModel from "../DB/models/user.model.js";
export const sendMessage=async(req,res,next)=>{
    
    const{receiver,sender,content}=req.body

    const receiverExists=await UserModel.findById(receiver)
    if(!receiverExists){
        return next(new Error(messages.UserModel.notfound,{cause:404}))
    }
    
    let message;
    let senderExists
    if(sender){
        senderExists=await Users.findById(sender)
        if(!senderExists){
            return next(new Error(messages.user.notfound,{cause:404}))
        }
        message = await Message.create({receiver,content,sender});
    } else {
        message = await Message.create({receiver,content});
    }
    
    return res.status(201).json({
        success:true,
        message:messages.message.createdSuccessfully,
        data:{
            message,
            senderUserName:sender?senderExists.userName:null
        }
    })
}

export const getMessages=async(req,res,next)=>{

    const userExists=req.user
     
    let msgs
    if(req.query.flag==="1"){
         msgs=await Message.find({sender:userExists._id})
    }else{
         msgs=await Message.find({receiver:userExists._id})
        }

    if(msgs.length===0){
        return next(new Error(messages.messages.notfound,{cause:404}))
    }

    return res.status(200).json({
        success:true,
        messages:msgs
    })

}

export const deleteMessage=async(req,res,next)=>{
    
    const userExists=req.user

    const del=await Message.deleteOne({_id:req.params.id,$or:[{receiver:userExists._id},{sender:userExists._id}]})
    if(del.deletedCount===0){
        return next(new Error(messages.message.notfound,{cause:404}))
    }

    return res.status(200).json({
        success:true,
        message:messages.message.deletedSuccessfully
    })
}

