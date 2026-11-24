
import mongoose from "mongoose";
import userModel, { type IUser } from "../models/user.model.js";
import { DBRepository } from "./db.repository.js";

class AuthRepository extends DBRepository {
    private readonly _userModel = userModel;

    async findUser(filter: mongoose.QueryFilter<IUser>) {
        return await this.findOne({
            model: this._userModel,
            filter
        });
    }

    async createUser(data: Partial<IUser>) {
        return await this.create({
            model: this._userModel,
            data
        });
    }

    async findUserById(
        id: string,
        projection?: mongoose.ProjectionType<IUser>
    ) {
        return await this.findById({
            model: this._userModel,
            id,
            ...(projection !== undefined && { projection })
        });
    }

    async updateUser(
        filter: mongoose.QueryFilter<IUser>,
        update: mongoose.UpdateQuery<IUser>
    ) {
        return await this.findOneAndUpdate({
            model: this._userModel,
            filter,
            update
        });
    }

    async updateUserById(
        id: string,
        update: mongoose.UpdateQuery<IUser>,
        options: mongoose.QueryOptions<IUser> = {}
    ) {
        return await this.findByIdAndUpdate({
            model: this._userModel,
            id,
            update,
            options
        });
    }
}

export default new AuthRepository();
