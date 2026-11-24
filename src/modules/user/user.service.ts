
import type { Request } from "express";
import userRepository from "../../DB/repositories/user.repository.js";
import { AppError } from "../../common/utils/globalErrorHandling.js";
import { successResponse } from "../../common/utils/success.response.js";

class UserService {

    private readonly _userRepository = userRepository;

    constructor() {}

    // =================followUser method=================

    followUser = successResponse(async (req: Request) => {

        if (!req.user) {
            throw new AppError("Unauthorized", 401);
        }

        const { id } = req.params;

        if (req.user.id === id) {
            throw new AppError("You cannot follow yourself", 400);
        }

        const userToFollow = await this._userRepository.findUserById(id as string);

        if (!userToFollow) {
            throw new AppError("User not found", 404);
        }

        const currentUser = await this._userRepository.findUserById(req.user.id);

        if (!currentUser) {
            throw new AppError("User not found", 404);
        }

        await this._userRepository.addFollowing(req.user.id, userToFollow._id);
        await this._userRepository.addFollower(userToFollow._id.toString(), currentUser._id);

        return {
            statusCode: 200,
            message: "User followed successfully"
        };
    });

    // =================unfollowUser method=================

    unfollowUser = successResponse(async (req: Request) => {

        if (!req.user) {
            throw new AppError("Unauthorized", 401);
        }

        const { id } = req.params;

        if (req.user.id === id) {
            throw new AppError("You cannot unfollow yourself", 400);
        }

        const userToUnfollow = await this._userRepository.findUserById(id as string);

        if (!userToUnfollow) {
            throw new AppError("User not found", 404);
        }

        await this._userRepository.removeFollowing(req.user.id, userToUnfollow._id);
        await this._userRepository.removeFollower(userToUnfollow._id.toString(), req.user.id);

        return {
            statusCode: 200,
            message: "User unfollowed successfully"
        };
    });

    // =================searchUsers method=================

    searchUsers = successResponse(async (req: Request) => {

        if (!req.user) {
            throw new AppError("Unauthorized", 401);
        }

        const { search } = req.query;

        if (!search || typeof search !== "string") {
            throw new AppError("Search value is required", 400);
        }

        const users = await this._userRepository.searchUsers(search, req.user.id);

        return {
            statusCode: 200,
            message: "Users retrieved successfully",
            data: { users }
        };
    });

    // =================suggestUsers method=================

    suggestUsers = successResponse(async (req: Request) => {

        if (!req.user) {
            throw new AppError("Unauthorized", 401);
        }

        const currentUser = await this._userRepository.findUserById(req.user.id);

        if (!currentUser) {
            throw new AppError("User not found", 404);
        }

        const users = await this._userRepository.suggestUsers(
            req.user.id,
            currentUser.following ?? []
        );

        return {
            statusCode: 200,
            message: "Suggested users retrieved successfully",
            data: { users }
        };
    });

    // =================updatePrivacy method=================

    updatePrivacy = successResponse(async (req: Request) => {

        if (!req.user) {
            throw new AppError("Unauthorized", 401);
        }

        const { isPrivate } = req.body as {
            isPrivate: boolean;
        };

        if (typeof isPrivate !== "boolean") {
            throw new AppError("isPrivate must be true or false", 400);
        }

        const user = await this._userRepository.updatePrivacy(req.user.id, isPrivate);

        if (!user) {
            throw new AppError("User not found", 404);
        }

        return {
            statusCode: 200,
            message: "Privacy settings updated successfully",
            data: { isPrivate: user.isPrivate }
        };
    });

}

export default new UserService();
