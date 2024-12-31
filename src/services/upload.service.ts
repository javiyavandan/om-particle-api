import { Request, Response } from "express";
import {
  getLocalDate,
  resBadRequest,
  resSuccess,
  resUnknownError,
} from "../utils/shared-functions";
import multer from "multer";
import path from "path";
import fs from "fs";
import { MulterCustomError } from "../helpers/custom-error.helper";
const IMAGE_FILE_LIMIT = 1 * 1024 * 1024;
const IMAGE_FILE_MIMETYPE = ["image/jpg", "image/jpeg"];
const MULTER_FILE_LIMIT_ERROR_CODE = "LIMIT_FILE_SIZE";

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/temp/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + getLocalDate().valueOf() + ext);
  },
});

var multerImageFile = multer({
  storage: storage,
  fileFilter: (req, file, callback) => {
    if (!IMAGE_FILE_MIMETYPE.includes(file.mimetype)) {
      return callback(
        new MulterCustomError(
          "Multer Error",
          resUnknownError({ message: "Invalid minetype!" })
        )
      );
    }
    return callback(null, true);
  },
  limits: { fileSize: IMAGE_FILE_LIMIT },
}).single("myImageFile");

export const uploadImage = async (req: Request, res: Response) => {
  const data = await new Promise((resolve, reject) => {
    multerImageFile(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === MULTER_FILE_LIMIT_ERROR_CODE) {
          return resolve(
            resBadRequest({
              message: "Maximum file size is " + IMAGE_FILE_LIMIT + "B.",
            })
          );
        }
        return resolve(resUnknownError({ data: err.message }));
      } else if (err instanceof MulterCustomError) {
        return resolve(err.getData());
      } else if (err) {
        return resUnknownError(err);
      }
      return resolve(resSuccess({ message: "Successfully uploaded" }));
    });
  });
  return data;
};

const saveBufferToFile = (buffer: Buffer) => {
  fs.open("input.jpeg", "a", function (err, fd) {
    // If the output file does not exists
    // an error is thrown else data in the
    // buffer is written to the output file
    if (err) {
      console.log("Cant open file");
    } else {
      fs.write(
        fd,
        buffer,
        0,
        buffer.length,
        null,
        function (err, writtenbytes) {
          if (err) {
            console.log("Cant write to file");
          } else {
            console.log(writtenbytes + " characters added to file");
          }
        }
      );
    }
  });
};

// for aspect ratio https://github.com/image-size/image-size/blob/main/lib/types/jpg.ts
function extractSize(buffer: Buffer, index: number) {
  return {
    height: buffer.readUInt16BE(index),
    width: buffer.readUInt16BE(index + 2),
  };
}

function calculate(buffer: Buffer) {
  // Skip 4 chars, they are for signature
  buffer = buffer.slice(4);

  // let orientation: number | undefined
  let next: number;
  while (buffer.length) {
    // read length of the next block
    const i = buffer.readUInt16BE(0);

    // if (isEXIF(buffer)) {
    //   orientation = validateExifBlock(buffer, i)
    // }

    // ensure correct format
    // validateBuffer(buffer, i)

    // 0xFFC0 is baseline standard(SOF)
    // 0xFFC1 is baseline optimized(SOF)
    // 0xFFC2 is progressive(SOF2)
    next = buffer[i + 1];
    if (next === 0xc0 || next === 0xc1 || next === 0xc2) {
      const size = extractSize(buffer, i + 5);

      // TODO: is orientation=0 a valid answer here?
      // if (!orientation) {
      //   return size
      // }

      return {
        height: size.height,
        // orientation,
        width: size.width,
      };
    }

    // move to the next block
    buffer = buffer.slice(i + 2);
  }
}
