
import { Router } from "express";
import AS from "./auth.service.js";
import { authentication } from "../../common/middleware/authentication.js";
import { Validation } from "../../common/middleware/validation.js";
import {
    signUpSchema,
    confirmEmailSchema,
    reSendOtpSchema,
    signUpWithGmailSchema,
    signinSchema,
    shareProfileSchema,
    refreshTokenSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    updateProfileSchema,
    updatePasswordSchema,
    logoutSchema
} from "./auth.validation.js";

const authRouter = Router();

authRouter.post("/signUp", Validation(signUpSchema), AS.signUp);
authRouter.post("/confirmEmail", Validation(confirmEmailSchema), AS.confirmEmail);
authRouter.post("/reSendOtp", Validation(reSendOtpSchema), AS.reSendOtp);
authRouter.post("/signUpWithGmail", Validation(signUpWithGmailSchema), AS.signUpWithGmail);
authRouter.post("/signin", Validation(signinSchema), AS.signin);
authRouter.get("/profile", authentication, AS.getProfile);
authRouter.get("/shareProfile/:id", authentication, Validation(shareProfileSchema), AS.shareProfile);
authRouter.post("/refreshToken", Validation(refreshTokenSchema), AS.refresh_token);
authRouter.post("/forgotPassword", Validation(forgotPasswordSchema), AS.forgotPassword);
authRouter.post("/resetPassword", Validation(resetPasswordSchema), AS.resetPassword);
authRouter.post("/logout", Validation(logoutSchema), AS.logout);
authRouter.post("/logoutAll", authentication, AS.logoutAll);
authRouter.patch("/updateProfile", authentication, Validation(updateProfileSchema), AS.updateProfile);
authRouter.patch("/updatePassword", authentication, Validation(updatePasswordSchema), AS.updatePassword);
// authRouter.post("/test",AS.test)
export default authRouter;






