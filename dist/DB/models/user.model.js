import mongoose from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enum/user.enum.js";
const userSchema = new mongoose.Schema({
    fName: {
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 20,
        required: true
    },
    lName: {
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 20,
        required: true
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: function () {
            return this.provider === ProviderEnum.system;
        }
    },
    age: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        enum: [GenderEnum.male, GenderEnum.female],
        default: GenderEnum.male
    },
    role: {
        type: String,
        enum: [RoleEnum.user, RoleEnum.admin],
        default: RoleEnum.user
    },
    isConfirmed: {
        type: Boolean,
        default: false
    },
    phone: String,
    profileImage: String,
    isPrivate: {
        type: Boolean,
        default: false
    },
    followers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
    following: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
    provider: {
        type: String,
        enum: Object.values(ProviderEnum),
        default: ProviderEnum.system
    },
    changeCredentialAt: {
        type: Date
    }
}, {
    timestamps: true,
    strictQuery: true
});
// userSchema.pre("save",function(this :HydratedDocument<IUser&{is_new:Boolean}>){
//     console.log("==== pre save hook====");
//     console.log(this.isNew);
//     this.is_new =this.isNew
//     if(this.modifiedPaths().includes("password")){
//        this.password= hashSync(this.password,12) 
//     }
// })
// userSchema.post("save", async function(){
//     console.log("==== post save hook====");
//     const that = this as HydratedDocument<IUser & { is_new: boolean }>;
//     console.log(that.is_new);
//     if(that.is_new){
//         await sendEmail({
//             to: this.email,
//             subject: "confirm_email"
//         });
//     }
// });
// userSchema.pre("validate",function(){
//     console.log("==== pre validate hook====");
//     console.log(this);
//     if(this.age < 18){
//         throw new AppError("age must be more than 20 ",404)
//     }
// })
// // userSchema.post("validate",function(){
// //     console.log("==== post validate hook====");
// //     console.log(this);
// })
const userModel = mongoose.models.User ||
    mongoose.model("User", userSchema);
export default userModel;
