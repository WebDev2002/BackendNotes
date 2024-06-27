// import mongoose from "mongoose";
// import {DB_NAME} from './constant';
// require('dotenv').config({path: './env'})
// (async()=>{
//     try{
//       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//     }catch(error){
//         console.log(error);
//     }
// })()


import connectDB from "./db/dbconnect.js";
import dotenv from 'dotenv';
import { app } from "./app.js";
dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server running on ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("Error",error)
})