import multer from "multer";
import { tmpdir } from "node:os";
import { AppError } from "../utils/globalErrorHandling.js";
import { MulterEnum, StoreEnum } from "../enum/multer.enum.js";
const multerCloud = ({ customTypes = [MulterEnum.image], store_type = StoreEnum.memory, }) => {
    const storage = store_type == StoreEnum.memory
        ? multer.memoryStorage()
        : multer.diskStorage({
            destination: tmpdir(),
            filename: (req, file, cb) => {
                cb(null, Date.now() + "-" + Math.random() + "-" + file.originalname);
            },
        });
    function fileFilter(req, file, cb) {
        if (customTypes?.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new AppError("Invalid file", 400));
        }
    }
    const upload = multer({ storage, fileFilter });
    return upload;
};
export default multerCloud;
