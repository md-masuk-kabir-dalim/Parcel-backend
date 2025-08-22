import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";
import config from "../../config";
import ApiError from "../../errors/ApiErrors";
import handleClientError from "../../errors/handleClientError";
import handleZodError from "../../errors/handleZodError";
import { IGenericErrorMessage } from "../../interfaces/error";

const GlobalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message: string = error.message || "An unexpected error occurred.";
  let errorMessages: IGenericErrorMessage[] = [];
  const createErrorMessage = (
    path: string,
    msg: string
  ): IGenericErrorMessage => ({
    path,
    message: msg,
  });

  if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Invalid input data in database query.";
    const errorLines = error.message.split("\n");
    const lastLine = errorLines[errorLines.length - 1].trim();

    let fieldName = "unknown_field";
    const patterns = [
      {
        regex: /Argument `(.+?)` is missing/,
        message: (field: string) =>
          `Required field '${field}' is missing. Please provide a valid value.`,
      },
      {
        regex: /Invalid `(.+?)`/,
        message: (field: string) =>
          `Invalid value for '${field}'. Check the expected data type or format.`,
      },
      {
        regex: /Unknown argument `(.+?)`/,
        message: (field: string) =>
          `Unknown field '${field}' in query. Verify field names in your schema.`,
      },
      {
        regex: /Invalid value for argument `(.+?)`\. Expected (\w+)/,
        message: (field: string, expected: string) =>
          `Invalid value for '${field}'. Expected a valid ${expected} value as defined in your Prisma schema.`,
      },
    ];

    for (const pattern of patterns) {
      const match = lastLine.match(pattern.regex);
      if (match) {
        fieldName = match[1];
        message = pattern.message(fieldName, match[2] || "");
        errorMessages.push(createErrorMessage(fieldName, message));
        break;
      }
    }

    if (!errorMessages.length) {
      errorMessages.push(
        createErrorMessage(
          "",
          "Invalid query structure. Check your Prisma query syntax and ensure all provided values match the schema."
        )
      );
    }
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const simplifiedError = handleClientError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error instanceof ZodError) {
    const simplifiedError = handleZodError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errorMessages = [
      {
        path: "",
        message: error.message,
      },
    ];
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "Failed to initialize database connection.";
    errorMessages.push(
      createErrorMessage(
        "",
        `Check your database configuration (connection string, credentials, or network connectivity). Error code: ${
          error.errorCode || "unknown"
        }`
      )
    );
  } else if (error instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "Critical database engine error occurred.";
    errorMessages.push(
      createErrorMessage(
        "",
        "The Prisma engine encountered an unexpected error. Try restarting the application or contact the database administrator."
      )
    );
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "Unknown database request error.";
    errorMessages.push(
      createErrorMessage(
        "",
        "An unexpected error occurred while processing the database request. Check query syntax and database schema."
      )
    );
  } else if (error instanceof SyntaxError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Invalid syntax in request.";
    errorMessages.push(
      createErrorMessage(
        "",
        "Check your request payload for valid JSON or syntax errors."
      )
    );
  } else if (error instanceof TypeError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Invalid type in operation.";
    errorMessages.push(
      createErrorMessage(
        "",
        "Verify that all inputs match expected types in your operation."
      )
    );
  } else if (error instanceof ReferenceError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "Undefined reference error.";
    errorMessages.push(
      createErrorMessage(
        "",
        "An undefined variable or function was referenced. Check your code logic."
      )
    );
  } else if (error instanceof Error) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = error.message || "Unexpected error occurred.";
    errorMessages.push(createErrorMessage("", message));
  } else {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "An unexpected error occurred.";
    errorMessages.push(
      createErrorMessage(
        "",
        "An unknown error occurred. Please check server logs for details."
      )
    );
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    error:
      config.env !== "production"
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
  });
};

export default GlobalErrorHandler;
