import { Prisma } from "@prisma/client";
import httpStatus from "http-status";
import { IGenericErrorResponse } from "../interfaces/common";
import { IGenericErrorMessage } from "../interfaces/error";

const handleClientError = (
  error: Prisma.PrismaClientKnownRequestError
): IGenericErrorResponse => {
  let statusCode: number = httpStatus.BAD_REQUEST;
  let message = "Request failed due to a known database error.";
  let errorMessages: IGenericErrorMessage[] = [];

  switch (error.code) {
    case "P2000": {
      message = "The provided value is too long for the column.";
      errorMessages.push({
        path: (error.meta?.target as string) || "unknown_field",
        message,
      });
      break;
    }

    case "P2001": {
      message = "The record searched for does not exist.";
      errorMessages.push({
        path: (error.meta?.target as string) || "",
        message,
      });
      statusCode = httpStatus.NOT_FOUND;
      break;
    }

    case "P2002": {
      const target = error.meta?.target as string[] | string | undefined;
      let field = "unknown_field";

      if (Array.isArray(target)) {
        field = target[0];
      } else if (typeof target === "string") {
        field = target;
      }

      message = `The value for '${field}' already exists. It must be unique.`;
      errorMessages.push({ path: field, message });
      statusCode = httpStatus.CONFLICT;
      break;
    }

    case "P2003": {
      message = "Foreign key constraint failed on the field.";
      errorMessages.push({
        path: (error.meta?.field_name as string) || "unknown_field",
        message,
      });
      break;
    }

    case "P2004": {
      message = "A constraint was violated in the database.";
      errorMessages.push({
        path: (error.meta?.constraint as string) || "",
        message,
      });
      break;
    }

    case "P2005": {
      message =
        "The value stored in the database is invalid for the field type.";
      errorMessages.push({
        path: (error.meta?.field_name as string) || "unknown_field",
        message,
      });
      break;
    }

    case "P2006": {
      message = "The provided value is not valid for the field.";
      errorMessages.push({
        path: (error.meta?.field_name as string) || "unknown_field",
        message,
      });
      break;
    }

    case "P2007": {
      message = "Data validation error.";
      errorMessages.push({
        path: "",
        message,
      });
      break;
    }

    case "P2008": {
      message = "Failed to parse the query.";
      errorMessages.push({
        path: "",
        message,
      });
      break;
    }

    case "P2009": {
      message = "Query validation error.";
      errorMessages.push({
        path: "",
        message,
      });
      break;
    }

    case "P2010": {
      message = "Raw query failed.";
      errorMessages.push({
        path: "",
        message,
      });
      statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      break;
    }

    case "P2011": {
      message = "Null constraint violation on the field.";
      errorMessages.push({
        path: (error.meta?.field_name as string) || "unknown_field",
        message,
      });
      break;
    }

    case "P2012": {
      message = "Missing a required value.";
      errorMessages.push({
        path: (error.meta?.field_name as string) || "unknown_field",
        message,
      });
      break;
    }

    case "P2013": {
      message = "Missing the required argument.";
      errorMessages.push({
        path: (error.meta?.argument_name as string) || "unknown_argument",
        message,
      });
      break;
    }

    case "P2014": {
      message = "The change would violate a relation constraint.";
      errorMessages.push({
        path: (error.meta?.relation_name as string) || "unknown_relation",
        message,
      });
      break;
    }

    case "P2015": {
      message = "A related record could not be found.";
      errorMessages.push({
        path: (error.meta?.relation_name as string) || "unknown_relation",
        message,
      });
      statusCode = httpStatus.NOT_FOUND;
      break;
    }

    case "P2016": {
      message = "Query interpretation error.";
      errorMessages.push({
        path: "",
        message,
      });
      break;
    }

    case "P2017": {
      message = "The records for the relation are not connected.";
      errorMessages.push({
        path: (error.meta?.relation_name as string) || "unknown_relation",
        message,
      });
      break;
    }

    case "P2018": {
      message = "The required connected records were not found.";
      errorMessages.push({
        path: (error.meta?.relation_name as string) || "unknown_relation",
        message,
      });
      statusCode = httpStatus.NOT_FOUND;
      break;
    }

    case "P2019": {
      message = "Input error in query arguments.";
      errorMessages.push({
        path: "",
        message,
      });
      break;
    }

    case "P2020": {
      message = "Value out of range for the field type.";
      errorMessages.push({
        path: (error.meta?.field_name as string) || "unknown_field",
        message,
      });
      break;
    }

    case "P2021": {
      message = "The table does not exist in the database.";
      errorMessages.push({
        path: (error.meta?.table as string) || "unknown_table",
        message,
      });
      statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      break;
    }

    case "P2022": {
      message = "The column does not exist in the database.";
      errorMessages.push({
        path: (error.meta?.column as string) || "unknown_column",
        message,
      });
      statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      break;
    }

    case "P2023": {
      message = "Inconsistent data retrieved from the database.";
      errorMessages.push({
        path: "",
        message,
      });
      statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      break;
    }

    case "P2024": {
      message = "Timed out while connecting to the database.";
      errorMessages.push({
        path: "",
        message,
      });
      statusCode = httpStatus.REQUEST_TIMEOUT;
      break;
    }

    case "P2025": {
      message = "The requested record does not exist.";
      errorMessages.push({
        path: (error.meta?.cause as string) || "",
        message,
      });
      statusCode = httpStatus.NOT_FOUND;
      break;
    }

    case "P2026": {
      message = "The current database provider does not support this feature.";
      errorMessages.push({
        path: "",
        message,
      });
      statusCode = httpStatus.NOT_IMPLEMENTED;
      break;
    }

    case "P2027": {
      message = "Multiple errors occurred during query execution.";
      errorMessages.push({
        path: "",
        message,
      });
      statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      break;
    }

    case "P2028": {
      message = "Transaction API error occurred.";
      errorMessages.push({
        path: "",
        message,
      });
      statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      break;
    }

    case "P2030": {
      message = "Cannot find a fulltext index to use for the search.";
      errorMessages.push({
        path: "",
        message,
      });
      statusCode = httpStatus.BAD_REQUEST;
      break;
    }

    case "P2031": {
      message = "MongoDB replica set is required.";
      errorMessages.push({
        path: "",
        message,
      });
      statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      break;
    }

    case "P2033": {
      message =
        "A number used in the query does not fit into a 64-bit integer.";
      errorMessages.push({
        path: "",
        message,
      });
      break;
    }

    case "P2034": {
      message = "Transaction failed due to a write conflict or deadlock.";
      errorMessages.push({
        path: "",
        message,
      });
      statusCode = httpStatus.CONFLICT;
      break;
    }

    default: {
      message = error.message || "An unknown Prisma error occurred.";
      errorMessages.push({
        path: "",
        message,
      });
      statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  return {
    statusCode,
    message,
    errorMessages,
  };
};

export default handleClientError;
