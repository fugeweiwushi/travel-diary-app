# 旅游日记平台项目架构设计

## 1. 项目概述

本项目旨在开发一个旅游日记平台，包括用户系统（移动端）和审核管理系统（PC端）。用户可以在移动端发布、查看和分享游记，管理端则用于审核和管理用户发布的游记。

## 2. 技术选型

- **前端：** Next.js (React框架)，兼顾移动端和PC端开发，支持服务端渲染和静态站点生成，有利于SEO和首屏加载速度。
- **后端：** Node.js (Express.js框架)，轻量级且高效，适合构建RESTful API。
- **数据库：** 考虑到项目需求和Node.js生态，将采用MongoDB作为数据库，其灵活的文档模型适合存储游记这类非结构化数据。如果需要关系型数据库，则会考虑PostgreSQL或MySQL。
- **UI组件库：** 移动端和PC端都将使用 Shadcn/UI 配合 Tailwind CSS，以快速构建美观且一致的用户界面。
- **状态管理：** Zustand 或 React Context API，根据具体复杂度选择。
- **图片处理：** 后端使用 Sharp 库进行图片压缩。
- **视频处理：** 考虑使用 Cloudinary 或类似服务进行视频存储和转码，或者在后端使用 FFmpeg (如果环境允许)。

## 3. 系统架构

采用前后端分离的架构模式。

### 3.1 前端架构 (Next.js)

- **项目结构：**
    - `app/`: Next.js App Router 结构。
        - `(mobile)/`: 移动端用户系统路由组。
            - `auth/`: 登录、注册页面。
            - `diaries/`: 游记列表、详情、发布、我的游记页面。
            - `profile/`: 用户个人信息（暂未在需求中明确，可作为扩展）。
        - `(admin)/`: PC端审核管理系统路由组。
            - `auth/`: 管理员登录页面。
            - `dashboard/`: 审核列表页面。
        - `api/`: Next.js API Routes (如果部分简单后端逻辑希望集成在Next.js中)。
    - `components/`: 可复用UI组件。
        - `common/`: 通用组件 (按钮、输入框、卡片等)。
        - `mobile/`: 移动端特定组件。
        - `admin/`: PC端特定组件。
    - `lib/`: 工具函数、API请求封装、常量等。
    - `store/`: 状态管理 (Zustand/Context)。
    - `styles/`: 全局样式、Tailwind CSS 配置。
    - `public/`: 静态资源。

- **移动端应用架构：**
    - **页面路由：**
        - `/` (或 `/m/`): 游记列表 (首页)
        - `/m/my-diaries`: 我的游记
        - `/m/publish-diary`: 游记发布/编辑
        - `/m/diary/[id]`: 游记详情
        - `/m/login`: 用户登录
        - `/m/register`: 用户注册
    - **组件划分：**
        - `DiaryCard`: 游记卡片组件 (用于列表页)
        - `DiaryForm`: 游记发布/编辑表单组件
        - `ImageCarousel`: 图片轮播组件 (用于详情页)
        - `VideoPlayer`: 视频播放组件
        - `SearchBar`: 搜索栏组件
        - `AuthForm`: 登录/注册表单组件
    - **状态管理：**
        - 用户认证状态 (token, user info)
        - 游记列表数据、分页状态
        - 当前游记详情数据
        - 表单数据

- **PC端管理系统架构：**
    - **页面路由：**
        - `/admin/login`: 管理员登录
        - `/admin/dashboard`: 审核列表
    - **组件划分：**
        - `ReviewTable`: 审核列表表格组件
        - `FilterControls`: 筛选控件组件
        - `AdminAuthForm`: 管理员登录表单
    - **权限控制：**
        - 基于角色的访问控制 (RBAC)。
        - 中间件或高阶组件进行路由保护。

### 3.2 后端架构 (Node.js + Express.js)

- **项目结构 (示例，手动搭建):**
    - `config/`: 配置文件 (数据库连接、环境变量等)。
    - `controllers/`: 处理请求逻辑，调用服务。
        - `authController.js`
        - `diaryController.js`
        - `adminController.js`
    - `middlewares/`: 中间件 (认证、错误处理、日志等)。
        - `authMiddleware.js` (用户认证)
        - `adminAuthMiddleware.js` (管理员认证)
        - `uploadMiddleware.js` (文件上传处理, e.g., Multer)
        - `imageCompressionMiddleware.js` (图片压缩)
    - `models/`: 数据库模型 (Mongoose Schemas for MongoDB)。
        - `User.js`
        - `Diary.js`
        - `AdminUser.js` (或在User模型中增加role字段)
    - `routes/`: API路由定义。
        - `authRoutes.js`
        - `diaryRoutes.js`
        - `adminRoutes.js`
    - `services/`: 业务逻辑封装。
        - `userService.js`
        - `diaryService.js`
        - `reviewService.js`
    - `utils/`: 工具函数。
    - `app.js`: Express应用入口。
    - `server.js`: HTTP服务器启动。

- **API接口设计 (RESTful API):**
    - **用户认证:**
        - `POST /api/auth/register`: 用户注册
        - `POST /api/auth/login`: 用户登录
        - `GET /api/auth/me`: 获取当前用户信息 (需要认证)
    - **游记管理 (用户端):**
        - `GET /api/diaries`: 获取游记列表 (瀑布流，分页，可带搜索参数 title, authorNickname)
        - `POST /api/diaries`: 发布新游记 (需要认证)
        - `GET /api/diaries/my`: 获取我的游记 (需要认证，区分状态)
        - `GET /api/diaries/:id`: 获取游记详情
        - `PUT /api/diaries/:id`: 更新游记 (需要认证，作者本人)
        - `DELETE /api/diaries/:id`: 删除游记 (需要认证，作者本人)
    - **文件上传:**
        - `POST /api/upload/image`: 上传图片 (返回图片URL)
        - `POST /api/upload/video`: 上传视频 (返回视频URL)
    - **审核管理 (PC端):**
        - `POST /api/admin/auth/login`: 管理员登录
        - `GET /api/admin/diaries`: 获取所有游记列表 (供审核，可按状态筛选)
        - `PUT /api/admin/diaries/:id/approve`: 审核通过游记 (需要管理员/审核员认证)
        - `PUT /api/admin/diaries/:id/reject`: 审核拒绝游记 (需要管理员/审核员认证，带原因)
        - `DELETE /api/admin/diaries/:id`: 删除游记 (逻辑删除，需要管理员认证)

### 3.3 数据库设计

- **User (用户表):**
    - `_id`: ObjectId (Primary Key)
    - `username`: String (Unique, Indexed)
    - `password`: String (Hashed)
    - `nickname`: String (Unique, Indexed)
    - `avatarUrl`: String (Default value if not uploaded)
    - `createdAt`: Date
    - `updatedAt`: Date

- **Diary (游记表):**
    - `_id`: ObjectId (Primary Key)
    - `title`: String (Required, Indexed for search)
    - `content`: String (Required)
    - `images`: [String] (Array of image URLs, compressed)
    - `videoUrl`: String (Optional)
    - `authorId`: ObjectId (Ref: User, Indexed)
    - `authorNickname`: String (Denormalized for faster queries, Indexed for search)
    - `authorAvatar`: String (Denormalized)
    - `status`: String (Enum: 'pending', 'approved', 'rejected', Default: 'pending', Indexed)
    - `rejectReason`: String (Optional, if status is 'rejected')
    - `isDeleted`: Boolean (For logical delete, Default: false, Indexed)
    - `createdAt`: Date
    - `updatedAt`: Date

- **AdminUser (管理员/审核员表):** (或者在User表中增加role字段)
    - `_id`: ObjectId (Primary Key)
    - `username`: String (Unique, Indexed)
    - `password`: String (Hashed)
    - `role`: String (Enum: 'admin', 'reviewer', Indexed)
    - `createdAt`: Date
    - `updatedAt`: Date

    *如果使用User表并增加role字段：*
    - `User.role`: String (Enum: 'user', 'admin', 'reviewer', Default: 'user')

### 3.4 数据交互流程

1.  **用户注册/登录：** 前端发送凭证 -> 后端校验/创建用户 -> 返回JWT Token -> 前端存储Token。
2.  **发布游记：**
    *   前端填写表单 -> 上传图片/视频到后端 -> 后端压缩图片/处理视频，返回URLs -> 前端将URLs及其他内容提交 -> 后端校验数据，创建游记记录 (status: 'pending') -> 返回成功/失败。
3.  **查看游记列表：** 前端请求 -> 后端查询 approved 状态的游记 (分页、搜索) -> 返回游记数据。
4.  **查看我的游记：** 前端请求 (带Token) -> 后端查询当前用户发布的游记 (区分状态) -> 返回数据。
5.  **审核游记：**
    *   管理员/审核员登录 -> 前端请求审核列表 (带Token) -> 后端返回待审核/所有游记 -> 管理员/审核员操作 (通过/拒绝/删除) -> 前端发送请求 -> 后端更新游记状态/删除标记，记录拒绝原因 -> 返回成功/失败。

## 4. 关键功能点实现思路

- **图片压缩：** 后端接收图片上传后，使用 `sharp` 库进行压缩处理再存储。
- **视频处理：** 允许上传一个视频。基础要求是点击后全屏播放。后端存储视频文件或其URL。
- **瀑布流加载：** 前端使用 Intersection Observer API 或滚动事件监听实现无限滚动和分页加载。
- **搜索功能：** 后端API支持按标题、作者昵称进行模糊查询 (数据库索引优化)。
- **角色权限：**
    - 后端通过JWT中间件验证用户身份和角色。
    - 不同角色的API接口进行权限控制。
    - 前端根据用户角色动态显示/隐藏操作按钮。
- **逻辑删除：** 游记数据不直接从数据库删除，而是设置 `isDeleted: true` 标记。
- **管理员账户：** 简化处理，可以通过配置文件或初始化脚本预设管理员账户。

## 5. 部署方案

- **前端 (Next.js):** Vercel, Netlify, 或 Cloudflare Pages (如果使用Wrangler模板中的D1数据库等Cloudflare服务)。
- **后端 (Node.js + Express):** Heroku, AWS Elastic Beanstalk, Google App Engine, DigitalOcean App Platform, 或自行部署到VPS。
- **数据库 (MongoDB):** MongoDB Atlas (云服务) 或自建实例。
- **文件存储 (图片/视频):** AWS S3, Google Cloud Storage, Cloudinary, 或服务器本地存储 (需考虑扩展性和备份)。

## 6. 待定与优化点

- **实时通知：** 游记审核状态变更后，是否需要实时通知用户 (WebSocket)。(超出基本要求)
- **分享功能：** 移动端分享到微信等社交媒体，可能需要H5承接页。
- **高级视频功能：** 封面图、WiFi下自动播放等 (进阶要求)。
- **性能优化：** 代码分割、懒加载、CDN、数据库查询优化等。
- **安全性：** XSS, CSRF防护, 输入校验, API限流等。

这个架构设计文档将作为后续开发的基础。细节将在各模块开发过程中进一步完善。

