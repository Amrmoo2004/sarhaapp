export const isValid=(schema)=>{
    return (req,res,next)=>{
        
        try {
        const data={...req.body,...req.params,...req.query}
        const result=schema.validate(data,{abortEarly:false})
        
        if(result.error){
            let messages=result.error.details.map(obj=>obj.message)
            return next(new Error(messages,{cause:400}))
        }

        return next()
        } 
        catch (error) {
            return next(new Error(error.message,{cause:500}))
        }
       
    }
}