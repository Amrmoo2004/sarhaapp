import multer from 'multer';

export const filevalidation = {
  Image: ['image/jpeg', 'image/png'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

export const cloudfileuploader = ({ validation = [] } = {}) => {
  const storage = multer.diskStorage({});
  
  function filefilter(req, file, cb) {
    if (validation.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error("invalid file type"), false);
  }

  const upload = multer({ storage, fileFilter: filefilter });
  return upload;
};