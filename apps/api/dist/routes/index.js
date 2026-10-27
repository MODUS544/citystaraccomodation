"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const health_routes_1 = require("./health.routes");
const rooms_routes_1 = require("./rooms.routes");
const bookings_routes_1 = require("./bookings.routes");
const admin_routes_1 = require("./admin.routes");
const settings_routes_1 = require("./settings.routes");
const frontdesk_routes_1 = require("./frontdesk.routes");
exports.apiRouter = (0, express_1.Router)();
// Mount modular sub-routers
exports.apiRouter.use('/health', health_routes_1.healthRouter);
exports.apiRouter.use('/rooms', rooms_routes_1.roomsRouter);
exports.apiRouter.use('/bookings', bookings_routes_1.bookingsRouter);
exports.apiRouter.use('/admin', admin_routes_1.adminRouter);
exports.apiRouter.use('/settings', settings_routes_1.settingsRouter);
exports.apiRouter.use('/frontdesk', frontdesk_routes_1.frontdeskRouter);
//# sourceMappingURL=index.js.map