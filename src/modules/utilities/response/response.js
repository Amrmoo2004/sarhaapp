import { json } from "express";

export const asynchandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error("Error in async handler:", error);
      next(new Error(error.message, { cause: 500 }));
    });
  };
};
export const globalErrorHandler = (error, req, res, next) => {
 return  res.status(error.cause||500).json({message: error.message});
};

export const successResponse = (res, data, statusCode = 200) => {
    return res.status(statusCode).json({
        status: "success",
        message: "Request was successful",
        data: data  
    });
};