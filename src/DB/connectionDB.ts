import mongoose from "mongoose";
import { DB_URI } from "../config/config.service.js";

const ConnectionDB = async (): Promise<void> => {
    try {
        await mongoose.connect(DB_URI);
        console.log("DB connected successfully");
    } catch (error) {
        console.error("DB failed to connect:", error);
        throw error;
    }
};

export default ConnectionDB;