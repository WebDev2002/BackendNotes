import mongoose, { Schema } from "mongoose";
import  jsonwebtoken  from "jsonwebtoken";
import bcryptjs from "bcryptjs"  ;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avtar: {
        type: String, // cloude url
        // required: true,
    },
    coverimg: {
        type: String, // cloude url
    },
    watchhistory: {
        type: Schema.Types.ObjectId,
        ref: "video"
    },
    password: {
        type: String,
        required: true
    },

    refreshtoken: {
        type: String,
    }

}, { timeseries: true })

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcryptjs.hash(this.password, 10)
    next()
})

userSchema.methods.ispasswordcorrect = async function(password){
  return await bcryptjs.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jsonwebtoken.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.method.refreshToken = function(){
    return jsonwebtoken.sign(
        {
            _id:this._id, 
        },
        process.env.REFRESH_TOKEM_SECRET,
        {
        expiresIn: process.env.REFRESH_TOKEM_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)