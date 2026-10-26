"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
const zod_1 = require("zod");
const errors_1 = require("../utils/errors");
function validateRequest(schemas) {
    return async (req, _res, next) => {
        try {
            if (schemas.params) {
                req.params = await schemas.params.parseAsync(req.params);
            }
            if (schemas.query) {
                req.query = await schemas.query.parseAsync(req.query);
            }
            if (schemas.body) {
                req.body = await schemas.body.parseAsync(req.body);
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const formattedIssues = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                    rule: issue.code,
                }));
                return next(new errors_1.BadRequestError('Validation error on incoming request data', 'VALIDATION_ERROR', formattedIssues));
            }
            next(error);
        }
    };
}
//# sourceMappingURL=validate.middleware.js.map