import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async()=>{
    try{
await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
console.log("MongoDB connect")
    }catch(error){
        console.log(error);
    }
}

export default connectDB;