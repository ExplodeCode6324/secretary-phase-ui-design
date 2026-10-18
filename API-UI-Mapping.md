# 页面与后端对象对应

核对日期：2026-10-19。只用于约束页面信息结构；样式稿没有 API 客户端，不声明业务功能已实现。

核对来源为 Secretary Core 的 application-service、API routes/contracts 及 OpenAPI。当前仓库独立保存设计对应关系，不包含或依赖 Core 源码；以下是核对当日的设计依据，后续接口接入需要重新核对。

| 页面 | 当前接口 / 对象 | 样式呈现 |
| --- | --- | --- |
| 对话 | `GET /api/v1/assistant`、`GET /api/v1/session`、`GET /api/v1/timeline`、`POST /api/v1/messages` | 助手名称、时间线、文字输入；发送体为 request_id + text |
| 任务 | `GET /api/v1/tasks`、`GET /api/v1/tasks/{id}`、任务 requests / executions、`POST /api/v1/task-requests` | 任务列表、状态、目标详情、创建目标输入 |
| 记忆 | `GET /api/v1/memory/summary`、`memory/commitments`、`world/facts` | 摘要、承诺、世界事实、来源摘录 |
| 产物 | `GET /api/v1/artifacts`、`artifacts/{id}`、`artifacts/{id}/content` | 产物列表、内容预览 |
| 待处理 | `GET /api/v1/attention`、`decisions`、`authorizations`；answer / decision 命令 | 决定选项与授权范围分开呈现 |
| 通知 | `GET /api/v1/notifications`，presented / read 命令 | 通知浮层与已读状态 |
| 助手配置 | `GET /api/v1/settings`、`POST settings/draft`、`POST settings/apply` | 草稿、变更复核、应用反馈 |

外观强度、线稿切换和动效样本属于设计复核工具，不对应 Core 设置字段。设置草稿的真实结构包含 revision、instructions、edits 等，本轮只展示指令内容的布局。

任务的状态标签为设计占位，后续应依据 Task / Execution / Decision 对象定义对应关系。产物页的原图来自本地参考目录，不伪装成真实后端产物。搜索仅匹配样式稿页面，不表示后端已有全局搜索 API。

当前 capabilities 明确附件上传为 `UPLOAD_NOT_IMPLEMENTED`。因此不设置可用上传按钮；概念图中的回收站、通用文件管理与设备工具未纳入本轮页面。定时唤醒、Scope、推送目标等服务管理对象留待技术选型与功能范围确定后补充。
