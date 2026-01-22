<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1UNb1aap510YjPw34AvcYF4rEZg17SauC

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 部署到 Netlify

### 方法一：通过 Netlify 网站部署（推荐）

1. **准备代码仓库**
   - 将代码推送到 GitHub、GitLab 或 Bitbucket

2. **登录 Netlify**
   - 访问 [netlify.com](https://www.netlify.com)
   - 使用 GitHub/GitLab/Bitbucket 账号登录

3. **创建新站点**
   - 点击 "Add new site" → "Import an existing project"
   - 选择你的代码仓库
   - Netlify 会自动检测到 `netlify.toml` 配置文件

4. **配置环境变量**
   - 在站点设置中，进入 "Site settings" → "Environment variables"
   - 添加环境变量：
     - 变量名：`GEMINI_API_KEY`
     - 值：你的 Gemini API 密钥

5. **部署**
   - 点击 "Deploy site"
   - 等待构建完成

### 方法二：通过 Netlify CLI 部署

1. **安装 Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **登录 Netlify**
   ```bash
   netlify login
   ```

3. **初始化项目**
   ```bash
   netlify init
   ```
   按照提示选择：
   - 创建新站点或链接现有站点
   - 构建命令：`npm run build`
   - 发布目录：`dist`

4. **设置环境变量**
   ```bash
   netlify env:set GEMINI_API_KEY "你的API密钥"
   ```

5. **部署**
   ```bash
   netlify deploy --prod
   ```

### 注意事项

- 确保 `netlify.toml` 文件已创建（已包含在项目中）
- 构建输出目录为 `dist`
- 所有路由会重定向到 `index.html`（支持单页应用路由）
- 环境变量需要在 Netlify 控制台中设置，不会从 `.env.local` 文件读取
