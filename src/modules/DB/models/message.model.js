import { ObjectId } from "bson";
import { Schema,model } from "mongoose";

//schema
const messageSchema=new Schema({

    content:{type:String,minlength:2,maxlength:500,required:true},
    sender:{type:ObjectId,ref:"User"},
    receiver:{type:ObjectId,required:true,ref:"User"},
    
},
    {timestamps:true,versionKey:false})

//model
export const Message=model("message",messageSchema)