import joi from "joi";

//send message schema
export const sendSchema=joi.object({

    content:joi.string().min(2).max(500).required(),
    receiver:joi.string().hex().length(24).required(),
    sender:joi.string().hex().length(24)
   
}).required()

//delete message schema
export const deleteSchema=joi.object({

    id:joi.string().hex().length(24).required(),
    
}).required()