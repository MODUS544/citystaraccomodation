import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
export interface RequestValidationSchemas {
    body?: ZodSchema<any>;
    query?: ZodSchema<any>;
    params?: ZodSchema<any>;
}
export declare function validateRequest(schemas: RequestValidationSchemas): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
