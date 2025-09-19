import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";

// Generic validation middleware
export const validate =
  (schema: Schema) => (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false }); // collect all errors
    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details.map((d) => d.message),
      });
    }
    next();
  };
