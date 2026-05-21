"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const data_service_1 = require("../../data/data.service");
let AuthGuard = class AuthGuard {
    data;
    constructor(data) {
        this.data = data;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers?.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new common_1.HttpException('Необходим заголовок Authorization: Bearer <token>', common_1.HttpStatus.UNAUTHORIZED);
        }
        const token = authHeader.substring('Bearer '.length);
        const user = this.data.findUserById(token);
        if (!user) {
            throw new common_1.HttpException('Пользователь не найден', common_1.HttpStatus.UNAUTHORIZED);
        }
        request.user = user;
        return true;
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [data_service_1.DataService])
], AuthGuard);
//# sourceMappingURL=auth.guard.js.map