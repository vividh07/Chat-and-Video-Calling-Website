import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";
import { BadRequestException } from "../utils/app-error";

export const validate =
  (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body ?? {},
        query: req.query ?? {},
        params: req.params ?? {},
      }) as {
        body?: Record<string, unknown>;
        query?: Record<string, unknown>;
        params?: Record<string, unknown>;
      };

      // Only mutate body — Express 5 query/params can be read-only
      if (parsed.body) {
        req.body = parsed.body;
      }

      if (parsed.query) {
        (req as Request & { validatedQuery?: Record<string, unknown> }).validatedQuery =
          parsed.query;
      }

      if (parsed.params) {
        Object.assign(req.params, parsed.params);
      }

      next();
    } catch (error: unknown) {
      const zodError = error as { errors?: Array<{ message?: string }> };
      const message = zodError?.errors?.[0]?.message || "Validation failed";
      next(new BadRequestException(message));
    }
  };
