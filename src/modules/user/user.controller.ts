
import { Router } from "express";
import { authentication } from "../../common/middleware/authentication.js";
import { Validation } from "../../common/middleware/validation.js";
import US from "./user.service.js";

import {
    followUserSchema,
    unfollowUserSchema,
    searchUsersSchema,
    updatePrivacySchema
} from "./user.validation.js";

const userRouter = Router();

userRouter.post("/follow/:id", authentication, Validation(followUserSchema), US.followUser);
userRouter.delete("/unfollow/:id", authentication, Validation(unfollowUserSchema), US.unfollowUser);
userRouter.get("/searchUsers", authentication, Validation(searchUsersSchema), US.searchUsers);
userRouter.get("/suggestUsers", authentication, US.suggestUsers);
userRouter.patch("/privacy", authentication, Validation(updatePrivacySchema), US.updatePrivacy);

export default userRouter;
