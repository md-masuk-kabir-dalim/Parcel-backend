import { NextFunction, Request, Response } from "express";
import xss from "xss";
function sanitizeInput(input: any): any {
  if (typeof input === "string") {
    return xss(input);
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeInput(item));
  }

  if (
    typeof input === "object" &&
    input !== null &&
    !(input instanceof Date) &&
    !(input instanceof Buffer)
  ) {
    const sanitizedObject: any = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        sanitizedObject[key] = sanitizeInput(input[key]);
      }
    }
    return sanitizedObject;
  }

  return input;
}

export const xssSanitizerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.body) {
      req.body = sanitizeInput(req.body);
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sanitizing input",
    });
  }
};
