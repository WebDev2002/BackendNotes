import { Router } from "express";
import { register } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { login } from "../controllers/user.controller.js";
import { logoutUser } from "../controllers/user.controller.js";
import { verifyuser } from "../middleware/auth.middleware.js";
import { refresgAccessToekn } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(

    upload.fields([
       {
        name:"avatar",
        maxCount:1
       },
       {
        name:"coverImg",
        maxCount:1
       }
    ]),  
    register
)

router.route("/login").post(login)

router.route("/logout").post(verifyuser, logoutUser)

router.route("/refreshtoken").post(refresgAccessToekn)

export default router;