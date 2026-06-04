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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const stories_service_1 = require("./stories.service");
const create_story_dto_1 = require("./dto/create-story.dto");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let StoriesController = class StoriesController {
    stories;
    constructor(stories) {
        this.stories = stories;
    }
    feed(role, employeeId) {
        return this.stories.feed(role, employeeId ?? null);
    }
    create(dto, role, employeeId) {
        return this.stories.create(dto, role, employeeId ?? null);
    }
    setPublishPermission(employeeId, dto, role) {
        return this.stories.setPublishPermission(role, employeeId, Boolean(dto?.canPublishStories));
    }
    markViewed(storyId, employeeId) {
        if (!employeeId)
            return { success: false };
        return this.stories.markViewed(storyId, employeeId);
    }
    setReaction(storyId, dto, employeeId) {
        if (!employeeId)
            return { success: false };
        return this.stories.setReaction(storyId, employeeId, dto?.emoji ?? '');
    }
};
exports.StoriesController = StoriesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Лента сторис (активные 24ч)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StoriesController.prototype, "feed", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Опубликовать сторис' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_story_dto_1.CreateStoryDto, String, String]),
    __metadata("design:returntype", void 0)
], StoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('publish-permission/:employeeId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.Admin, client_1.Role.HR),
    (0, swagger_1.ApiOperation)({ summary: 'Выдать/забрать право публикации сторис у сотрудника' }),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], StoriesController.prototype, "setPublishPermission", null);
__decorate([
    (0, common_1.Post)(':storyId/view'),
    (0, swagger_1.ApiOperation)({ summary: 'Отметить просмотр сторис' }),
    __param(0, (0, common_1.Param)('storyId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StoriesController.prototype, "markViewed", null);
__decorate([
    (0, common_1.Post)(':storyId/reaction'),
    (0, swagger_1.ApiOperation)({ summary: 'Поставить реакцию на сторис' }),
    __param(0, (0, common_1.Param)('storyId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], StoriesController.prototype, "setReaction", null);
exports.StoriesController = StoriesController = __decorate([
    (0, swagger_1.ApiTags)('stories'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('stories'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [stories_service_1.StoriesService])
], StoriesController);
//# sourceMappingURL=stories.controller.js.map