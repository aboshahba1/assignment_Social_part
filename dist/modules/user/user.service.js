import userModel from "../../DB/models/user.model.js";
import dbRepository from "../../DB/repositories/db.repository.js";
import { AppError } from "../../common/utils/globalErrorHandling.js";
import { success_response } from "../../common/utils/success.response.js";
class UserService {
    _userModel = userModel;
    _dbRepository = dbRepository;
    constructor() { }
    // =================followUser method=================
    followUser = async (req, res, next) => {
        if (!req.user) {
            throw new AppError("Unauthorized", 401);
        }
        const { id } = req.params;
        // Prevent following yourself
        if (req.user.id === id) {
            throw new AppError("You cannot follow yourself", 400);
        }
        // Find the user to follow
        const userToFollow = await this._dbRepository.findById({
            model: this._userModel,
            id: id
        });
        if (!userToFollow) {
            throw new AppError("User not found", 404);
        }
        // Find the current user
        const currentUser = await this._dbRepository.findById({
            model: this._userModel,
            id: req.user.id
        });
        if (!currentUser) {
            throw new AppError("User not found", 404);
        }
        // Add the target user to following
        await this._dbRepository.updateOne({
            model: this._userModel,
            filter: { _id: req.user.id },
            update: { $addToSet: { following: userToFollow._id } }
        });
        // Add the current user to target's followers
        await this._dbRepository.updateOne({
            model: this._userModel,
            filter: { _id: userToFollow._id },
            update: { $addToSet: { followers: currentUser._id } }
        });
        return success_response({
            res,
            statusCode: 200,
            message: "User followed successfully"
        });
    };
    // =================unfollowUser method=================
    unfollowUser = async (req, res, next) => {
        if (!req.user) {
            throw new AppError("Unauthorized", 401);
        }
        const { id } = req.params;
        // Prevent unfollowing yourself
        if (req.user.id === id) {
            throw new AppError("You cannot unfollow yourself", 400);
        }
        // Find the user to unfollow
        const userToUnfollow = await this._dbRepository.findById({
            model: this._userModel,
            id: id
        });
        if (!userToUnfollow) {
            throw new AppError("User not found", 404);
        }
        // Remove target user from current user's following
        await this._dbRepository.updateOne({
            model: this._userModel,
            filter: { _id: req.user.id },
            update: { $pull: { following: userToUnfollow._id } }
        });
        // Remove current user from target user's followers
        await this._dbRepository.updateOne({
            model: this._userModel,
            filter: { _id: userToUnfollow._id },
            update: { $pull: { followers: req.user.id } }
        });
        return success_response({
            res,
            statusCode: 200,
            message: "User unfollowed successfully"
        });
    };
    // =================searchUsers method=================
    searchUsers = async (req, res, next) => {
        if (!req.user) {
            throw new AppError("Unauthorized", 401);
        }
        const { search } = req.query;
        if (!search || typeof search !== "string") {
            throw new AppError("Search value is required", 400);
        }
        const users = await this._dbRepository.find({
            model: this._userModel,
            filter: {
                _id: { $ne: req.user.id },
                isConfirmed: true,
                isPrivate: false,
                $or: [
                    { fName: { $regex: search, $options: "i" } },
                    { lName: { $regex: search, $options: "i" } }
                ]
            },
            options: {
                select: "fName lName profileImage"
            }
        });
        return success_response({
            res,
            statusCode: 200,
            message: "Users retrieved successfully",
            data: { users }
        });
    };
    // =================suggestUsers method=================
    suggestUsers = async (req, res, next) => {
        if (!req.user) {
            throw new AppError("Unauthorized", 401);
        }
        const currentUser = await this._dbRepository.findById({
            model: this._userModel,
            id: req.user.id
        });
        if (!currentUser) {
            throw new AppError("User not found", 404);
        }
        const users = await this._dbRepository.find({
            model: this._userModel,
            filter: {
                _id: {
                    $ne: req.user.id,
                    $nin: currentUser.following
                },
                isConfirmed: true,
                isPrivate: false
            },
            options: {
                select: "fName lName profileImage",
                limit: 10
            }
        });
        return success_response({
            res,
            statusCode: 200,
            message: "Suggested users retrieved successfully",
            data: { users }
        });
    };
    // =================updatePrivacy method=================
    updatePrivacy = async (req, res, next) => {
        if (!req.user) {
            throw new AppError("Unauthorized", 401);
        }
        const { isPrivate } = req.body;
        if (typeof isPrivate !== "boolean") {
            throw new AppError("isPrivate must be true or false", 400);
        }
        const user = await this._dbRepository.findByIdAndUpdate({
            model: this._userModel,
            id: req.user.id,
            update: { $set: { isPrivate } },
            options: {
                projection: "-password -phone"
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }
        return success_response({
            res,
            statusCode: 200,
            message: "Privacy settings updated successfully",
            data: { isPrivate: user.isPrivate }
        });
    };
}
export default new UserService();
