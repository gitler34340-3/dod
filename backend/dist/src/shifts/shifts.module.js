"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftsModule = void 0;
const common_1 = require("@nestjs/common");
const common_module_1 = require("../common/common.module");
const prisma_module_1 = require("../prisma/prisma.module");
const payroll_module_1 = require("../payroll/payroll.module");
const notifications_module_1 = require("../notifications/notifications.module");
const shifts_controller_1 = require("./shifts.controller");
const shift_template_controller_1 = require("./shift-template.controller");
const shifts_service_1 = require("./shifts.service");
const shift_template_service_1 = require("./shift-template.service");
let ShiftsModule = class ShiftsModule {
};
exports.ShiftsModule = ShiftsModule;
exports.ShiftsModule = ShiftsModule = __decorate([
    (0, common_1.Module)({
        imports: [common_module_1.CommonModule, prisma_module_1.PrismaModule, payroll_module_1.PayrollModule, notifications_module_1.NotificationsModule],
        controllers: [shifts_controller_1.ShiftsController, shift_template_controller_1.ShiftTemplateController],
        providers: [shifts_service_1.ShiftsService, shift_template_service_1.ShiftTemplateService],
        exports: [shifts_service_1.ShiftsService, shift_template_service_1.ShiftTemplateService],
    })
], ShiftsModule);
//# sourceMappingURL=shifts.module.js.map