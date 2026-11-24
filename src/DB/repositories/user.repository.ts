
import mongoose from "mongoose";
import userModel from "../models/user.model.js";
import { DBRepository } from "./db.repository.js";

class UserRepository extends DBRepository {
    private readonly _userModel = userModel;

    async findUserById(id: string) {
        return await this.findById({
            model: this._userModel,
            id
        });
    }

    async addFollowing(userId: string, targetId: mongoose.Types.ObjectId) {
        return await this.updateOne({
            model: this._userModel,
            filter: { _id: userId },
            update: { $addToSet: { following: targetId } }
        });
    }

    async addFollower(userId: string, targetId: mongoose.Types.ObjectId) {
        return await this.updateOne({
            model: this._userModel,
            filter: { _id: userId },
            update: { $addToSet: { followers: targetId } }
        });
    }

    async removeFollowing(userId: string, targetId: mongoose.Types.ObjectId) {
        return await this.updateOne({
            model: this._userModel,
            filter: { _id: userId },
            update: { $pull: { following: targetId } }
        });
    }

    async removeFollower(userId: string, targetId: string) {
        return await this.updateOne({
            model: this._userModel,
            filter: { _id: userId },
            update: { $pull: { followers: targetId } }
        });
    }

    async searchUsers(search: string, currentUserId: string) {
        return await this.find({
            model: this._userModel,
            filter: {
                _id: { $ne: currentUserId },
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
    }

    async suggestUsers(currentUserId: string, following: mongoose.Types.ObjectId[]) {
        return await this.find({
            model: this._userModel,
            filter: {
                _id: {
                    $ne: currentUserId,
                    $nin: following
                },
                isConfirmed: true,
                isPrivate: false
            },
            options: {
                select: "fName lName profileImage",
                limit: 10
            }
        });
    }

    async updatePrivacy(userId: string, isPrivate: boolean) {
        return await this._userModel.findByIdAndUpdate(
            userId,
            { $set: { isPrivate } },
            { new: true, runValidators: true }
        ).select("-password -phone");
    }
}

export default new UserRepository();
