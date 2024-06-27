import { asynchandler } from "../utils/asynchandler.js";
import { User } from "../model/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiRespones } from "../utils/apiResponse.js";
import { uploadfile } from "../utils/cloudinary.js";
import jsonwebtoken from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenANDRefreshToken = async (userID) => {
    // try {
    const user = await User.findById(userID)
    const refreshtoken = user.refreshToken()
    const accessToken = user.generateAccessToken()
    user.refreshtoken = refreshtoken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshtoken }

    // } catch (error) {
    //     throw new apiError(500, "Somenthing went wrong")
    // }
}

const register = asynchandler(async (req, res) => {
    res.status(200).json({
        Message: "ok"
    })

    // Step for registration the user

    // get user details from frontend
    // validate the user
    // check user already exists
    // check avatar
    // upload them into cloudinary
    // create user object
    // remove password and refresh token from feild
    // check for user creation
    // return res

    const { username, email, fullname, password } = req.body

    console.log("username : ", username);

    if (username === "") {
        throw new apiError(400, "username is required")
    }
    else if (email === "") {
        throw new apiError(400, "email is required")
    }
    else if (fullname === "") {
        throw new apiError(400, "fullname is required")
    }
    else if (password === "") {
        throw new apiError(400, "password is required")
    }

    const existeduser = await User.findOne({
        $or: [{ username }, { email }]

    })

    if (existeduser) {
        throw new apiError(409, "User already exists")
    }

    const avatarlocalpath = req.files?.avtar[0]?.path;
    const coverImglocalpath = req.files?.coverimg[0]?.path;
    if (!avatarlocalpath) {
        throw new apiError(400, "Avatar image is required")
    }
    const avataruploded = await uploadfile(avatarlocalpath);
    const coverImguploded = await uploadfile(coverImglocalpath);
    if (!avataruploded) {
        throw new apiError(400, "Avatar image is required")
    }

    const user = await User.create({
        fullname,
        avtar: avataruploded.url,
        coverimg: coverImguploded?.url || "",
        email,
        password,
        username
    })

    const userIscreated = await User.findById(user._id).select(
        "-password -refreshtoken"
    )

    if (!userIscreated) {
        throw new apiError(500, "Something went wrong")
    }

    return res.status(201).json(
        new apiRespones(200, userIscreated, "User is created")
    )

})




const login = asynchandler(async (req, res) => {

    // req - body
    // username or email
    // find the user
    // password check
    // access token & refresh token gen
    // send cookies

    const { email, username, password } = req.body

    if (!(username || email)) {
        throw new apiError(400, "Username and email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new apiError(404, "user doesn't exist")
    }

    const passwordcheck = await user.ispasswordcorrect(password)
    if (!passwordcheck) {
        throw new apiError(401, "Password is coorect");
    }

    const { accessToken, refreshtoken } = await generateAccessTokenANDRefreshToken(user._id)

    const loginuser = User.findById(user._id).select("-password -refreshtoken")

    const option = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("accesstoken", accessToken, option).cookie("refreshtoken", refreshtoken, option).json(
        new apiRespones(
            200,
            {
                user: loginuser, accessToken, refreshtoken
            },
            "User logged In"
        )
    )

})

const logoutUser = asynchandler(async (req, res) => {
    await User.findByIdAndDelete(
        req.user._id,
        {
            $set: {
                refresftoken: undefined
            }
        },
        {
            new: true
        }
    )

    const option = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshtoken", option)
        .json(new apiRespones(200, {}, "user logout"))


})

const refresgAccessToekn = asynchandler(async (req, res) => {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new apiError(401, "unathorized access")
    }
    try {
        const decodeToken = jsonwebtoken.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEM_SECRET
        )


        const user = await User.findById(decodeToken?._id)


        if (!user) {
            throw new apiError(401, "Invalid token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new apiError(401, "Invalid token")
        }

        const option = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, refreshToken } = await generateAccessTokenANDRefreshToken(user._id)

        return res.status(200).cookie("accestoken", accessToken, option).cookie("refreshtoken", refreshToken, option)
            .json(
                new apiRespones
                    (
                        200,
                        {
                            accessToken,
                            refreshToken
                        },
                        "Done"
                    )
            )
    } catch (error) {
        throw new apiError(401, error?.message)
    }

})

const ChangeUserPassword = asynchandler(async (req, res) => {
    const { OldPassword, NewPassword } = req.body

    const user = await User.findById(req.user?._id)
    const ispasswordcorrect = await user.ispasswordcorrect(OldPassword)

    if (!ispasswordcorrect) {
        throw new apiError(400, "Invalid password")
    }

    user.password = NewPassword
    await user.save({ validateBeforeSave: false })

    return req.status(200).json(new apiRespones(
        200, {}, "password is changed"
    ))

})

const getCurrentUser = asynchandler(async (req, res) => {
    return res.status(200)
        .json(
            200, req.user, "Current user"
        )
})

const updateAccountDetails = asynchandler(async (req, res) => {
    const { fullname, email } = req.body

    if (!fullname || !email) {
        throw new apiError(400, "Email & fullname is empty")
    }
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        { new: true }
    ).select("-password")

    return res.status(200)
        .json(
            new apiRespones(200, "Account details is successfully update")
        )

})

const avatarUpdate = asynchandler(async (req, res) => {
    const avatarlocalpath = req.file?.path
    if (!avatarlocalpath) {
        throw new apiError(400, "file is not uploade properly")
    }
    const avatar = await uploadfile(avatarlocalpath)

    if (!avatar) {
        throw new apiError(400, "Error is not uploade properly")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar
            }
        },
        { new: true }

    ).select("-password")

    return res.status(200).json(
        new apiRespones(200, user, "avatar is updated")
    )

})

// create one util to delete the perivious avatar after updating

const coverimgUpdate = asynchandler(async (req, res) => {
    const coverimglocalpath = req.file?.path
    if (!coverimglocalpath) {
        throw new apiError(400, "coverimg is not uploade properly")
    }
    const coverimg = await uploadfile(coverimglocalpath)

    if (!coverimg) {
        throw new apiError(400, "Error is not uploade properly")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverimg
            }
        },
        { new: true }

    ).select("-password")

    return res.status(200).json(
        new apiRespones(200, user, "cover image is updated")
    )

})


// aggregate pipeline 

const getUserChannelProfite = asynchandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new apiError(400, "User is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username
            }

        },
        {
            $lookup:{
                from: "subscriptions",
                localField:"_id",
                foreignField:"Channel",
                as:"subscriber"
            }

        },
        {
            $lookup:{
                from: "subscriptions",
                localField:"_id",
                foreignField:"Subscriber",
                as:"subscriberTo"
            }
        },
        {
            $addFields:{
                subscriberCount: {
                    $size: "$subscriber"
                },
                subscriberCountToo: {
                    $size: "$subscriberTo"
                },
                issubscriber: {
                    $cond:{
                        if: {$in:[req.user?._id, "$subscriber.Subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscriberCount:1,
                subscriberCountToo:1,
                issubscriber:1

            }
        }
    ])

    if(!channel?.length){
        throw new apiError(404, "Channel dosen't exists")
    }

    return res.status(200).json(
        new apiRespones(200,channel[0],"User channel fetch successfully")
    )

})

// aggregate sub-pipeline


const userWatchHistory = asynchandler(async(req, res)=>{
 const user = await mongoose.aggregate([
    {
        $match:{
             _id: new mongoose.Types.ObjectId(req.user._id)
        }
    },
    {
        $lookup:{
            from:"videos",
            localField:"watchhistory",
            foreignField:"_id",
            as:"watchHistory",
            pipeline : [
                {
                    $lookup:{
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline : [
                            {
                                $project: {
                                    fullname : 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }
                        ]
                    }
                }
            ]

        }
    }
 ])

return res.status(200).res.json(
 new apiRespones(200, user[0].watchHistory),
 "Watch History fetch "
)

})



export { register, login, logoutUser, userWatchHistory, refresgAccessToekn, ChangeUserPassword, getCurrentUser, updateAccountDetails, avatarUpdate, coverimgUpdate, getUserChannelProfite }