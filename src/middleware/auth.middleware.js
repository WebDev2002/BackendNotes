import { apiError } from "../utils/apiError.js";
import { asynchandler } from "../utils/asynchandler.js";
import  jsonwebtoken  from "jsonwebtoken";
import { User } from "../model/user.model.js";

export const verifyuser = asynchandler(async(req , res , next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Aunthorization")?.replace("Bearer", "")
    
        if(!token){
           throw new apiError(401, "Unauthorized request")
        }
    
        const decodeToken = jsonwebtoken.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodeToken?._id).select("-password  -refresftoken")
    
        if(!user){
            throw new apiError(401, "invalid error")
        }
        req.user = user;
        next()
    } catch (error) {
        throw new apiError(401, error?.message || "invalid error")
    }
})