"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const common_1 = require("@nestjs/common");
const data_module_1 = require("../data/data.module");
const auth_guard_1 = require("./guards/auth.guard");
const manager_guard_1 = require("./guards/manager.guard");
let CommonModule = class CommonModule {
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Module)({
        imports: [data_module_1.DataModule],
        providers: [auth_guard_1.AuthGuard, manager_guard_1.ManagerGuard],
        exports: [auth_guard_1.AuthGuard, manager_guard_1.ManagerGuard],
    })
], CommonModule);
//# sourceMappingURL=common.module.js.map