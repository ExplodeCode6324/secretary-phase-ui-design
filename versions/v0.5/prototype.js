/* Only a local visual study. No network requests and no backend mutations. */
// Body paths never include helper rays, reticles, trails, or animation-only marks.
// Sampling regions refer to normalized portions of these exact body paths.
const geometry = {
  attention: {
    body: ["M12 3a6 6 0 0 0-6 6v6l-2 3h16l-2-3V9a6 6 0 0 0-6-6", "M10 21h4"],
    regions: [
      [0, 12, 19],
      [0, 39, 20],
      [0, 65, 16],
      [1, 5, 65],
    ],
  },
  search: {
    body: ["M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14", "M15 15l6 6"],
    regions: [
      [0, 10, 20],
      [0, 42, 18],
      [0, 70, 22],
      [1, 15, 55],
    ],
  },
  send: {
    body: ["M4 12h15", "M13 5l7 7-7 7"],
    regions: [
      [0, 10, 35],
      [1, 7, 25],
      [1, 56, 28],
      [0, 54, 28],
    ],
  },
  chat: {
    body: ["M4 4h16v12H10l-5 4v-4H4z", "M8 8h8", "M8 11h5"],
    regions: [
      [0, 15, 19],
      [0, 40, 18],
      [0, 66, 18],
      [1, 20, 45],
    ],
  },
  tasks: {
    body: ["M8 5H5v16h14V5h-3", "M9 3h6v4H9z", "M8 13l3 3 5-6"],
    regions: [
      [0, 5, 18],
      [0, 40, 20],
      [1, 10, 25],
      [2, 40, 35],
    ],
  },
  memory: {
    body: ["M5 3h14v18H5z", "M8 3v18", "M11 8h5 M11 12h5 M11 16h3"],
    regions: [
      [0, 10, 16],
      [0, 43, 20],
      [1, 20, 32],
      [0, 72, 17],
    ],
  },
  file: {
    body: ["M6 3h8l5 5v13H6z", "M14 3v6h5", "M9 13h7 M9 17h5"],
    regions: [
      [0, 10, 17],
      [0, 45, 20],
      [1, 5, 35],
      [0, 76, 15],
    ],
  },
  settings: {
    body: ["M4 7h16 M4 17h16", "M8 4v6", "M16 14v6"],
    regions: [
      [0, 3, 16],
      [0, 58, 20],
      [1, 10, 45],
      [2, 20, 45],
    ],
  },
  plus: {
    body: ["M12 4v16", "M4 12h16"],
    regions: [
      [0, 5, 28],
      [1, 55, 30],
      [0, 58, 25],
      [1, 5, 28],
    ],
  },
  check: {
    body: ["M5 12l4 4L19 6"],
    regions: [
      [0, 3, 23],
      [0, 40, 20],
      [0, 64, 26],
      [0, 25, 24],
    ],
  },
  arrow: {
    body: ["M5 12h14", "M14 7l5 5-5 5"],
    regions: [
      [0, 5, 32],
      [1, 5, 25],
      [1, 57, 30],
      [0, 55, 30],
    ],
  },
  motion: {
    body: ["M4 6h12v12H4z", "M8 3h12v12"],
    regions: [
      [0, 5, 18],
      [1, 8, 22],
      [0, 55, 20],
      [1, 65, 25],
    ],
  },
  close: {
    body: ["M5 5l14 14", "M19 5L5 19"],
    regions: [
      [0, 5, 28],
      [1, 58, 28],
      [0, 60, 25],
      [1, 8, 28],
    ],
  },
};
const icon = (name) => {
  const shape = geometry[name] || geometry.file;
  return `<span class="glyph glyph-${name}" data-glyph="${name}" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><g class="icon-body">${shape.body.map((d) => `<path class="part" d="${d}"/>`).join("")}</g><g class="signal-layer" aria-hidden="true"></g></svg></span>`;
};

const escapeHTML = (v) =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const pages = [
  ["conversation", "对话", "chat"],
  ["tasks", "任务", "tasks"],
  ["memory", "记忆", "memory"],
  ["artifacts", "产物", "file"],
  ["attention", "待处理", "attention"],
  ["settings", "设置", "settings"],
  ["motion", "动效样本", "motion"],
];
let current = "conversation",
  taskFilter = "全部",
  memoryFilter = "摘要",
  appearance = "styled",
  motion = "standard",
  readNotices = false;
let draftText = "保持表达清楚、直接。完成工作后，简要说明结果与待复核项。";
let tasks = [
  {
    id: "01",
    title: "整理界面设计语言",
    desc: "布局、组件与交互状态",
    state: "进行中",
    date: "10-19 09:42",
  },
  {
    id: "02",
    title: "复核页面的动效节奏",
    desc: "等待 Master 选择动效强度",
    state: "待决定",
    date: "10-19 09:28",
  },
  {
    id: "03",
    title: "收集视觉参考",
    desc: "整体视觉概念图 · 动效分镜",
    state: "已完成",
    date: "10-18 18:30",
  },
  {
    id: "04",
    title: "梳理工作空间的信息结构",
    desc: "对话、任务、记忆与产物",
    state: "已完成",
    date: "10-18 16:15",
  },
];
const statusClass = (s) =>
  ({ 进行中: "running", 待决定: "wait", 已完成: "done", 已停止: "stopped" })[
    s
  ] || "running";
const state = (s) => `<span class="state ${statusClass(s)}">${s}</span>`;
const button = (label, action, primary = false) =>
  `<button class="button ${primary ? "primary" : ""}" data-action="${action}">${label}</button>`;
function heading(title, en, desc, action = "") {
  return `<div class="page-heading"><div><h1>${title}</h1>${desc ? `<p>${desc}</p>` : ""}</div>${action}</div>`;
}
const main = document.querySelector("#main");
const dialog = document.querySelector("#dialog");
document.querySelector('[data-action="search"]').innerHTML = icon("search");
document
  .querySelector('[data-action="notifications"]')
  .insertAdjacentHTML("afterbegin", icon("attention"));
let renderedPage = null;
function render() {
  window.signalController?.clearAll();
  const valid = location.hash.slice(1);
  current = pages.some((p) => p[0] === valid) ? valid : "conversation";
  document.querySelector("#navigation").innerHTML = pages
    .map(
      ([id, label, i], idx) =>
        `${idx === 5 ? '<div class="nav-separator"></div>' : ""}<a href="#${id}" aria-label="${label}" title="${label}" ${id === current ? 'class="active" aria-current="page"' : ""}>${icon(i)}<span class="nav-label">${label}</span>${id === "attention" ? '<span class="count">' + (pendingAttention ? "02" : "00") + "</span>" : ""}</a>`,
    )
    .join("");
  document.querySelector("#breadcrumb").innerHTML =
    `工作空间 <span>/</span> ${pages.find((p) => p[0] === current)[1]}`;
  const switching = renderedPage !== current;
  main.innerHTML = `<div class="page ${switching ? "page-enter" : ""}">${views[current]()}</div>`;
  renderedPage = current;
  if (current === "conversation") restoreMessages();
}
let sentMessages = [],
  pendingAttention = true;
function conversation() {
  return `${heading("对话", "CONVERSATION", "")}<div class="conversation-layout"><section class="conversation" aria-label="对话记录"><div class="conversation-title">2026.10.19 <span>星期一</span></div><div id="messages"><article class="message"><div class="avatar">M</div><div><div class="message-meta"><strong>Master</strong><time>09:40</time></div><p>今天先把界面的设计语言整理清楚。</p><p>保留旧网页的排版秩序，交互时再露出一点蓝与浅蓝错位。<br>安静、清楚，像一个可以长久使用的私人工作空间。</p></div></article><article class="message"><div class="avatar assistant">P</div><div><div class="message-meta"><strong>PERRI</strong><time>09:41</time></div><p>先让信息各归其位，再让界面有自己的性格。</p><p>这一轮，我把设计收拢到三个层次：</p><ul><li>先用传统网页的导航、列表和表单组织信息。</li><li>暖白与墨色构成底色，蓝与浅蓝只停留在结构边缘。</li><li>交互时，本体保持稳定，派生信号片段短暂采样与重绘。</li></ul><div class="artifact-strip"><span class="file-icon">${icon("file")}</span><div><button class="text-button file-name" data-action="open-artifact">界面设计语言 · v0.1</button><small>Markdown · 今天 09:41 · 示例</small></div><button class="text-button" data-action="file-style-toggle" aria-pressed="false">对照卡片</button></div><div class="message-foot">${icon("check")} 示例对话 · 用于观察排版与阅读节奏</div></div></article></div><form class="composer" id="message-form"><div class="composer-box"><textarea id="message-input" aria-label="消息内容" placeholder="写下你的想法…" rows="2"></textarea><div class="composer-toolbar"><span>文字对话 <span aria-hidden="true">/</span> 不支持附件上传</span><button class="button primary" type="submit">发送 ${icon("send")}</button></div></div><div class="composer-help"><span>Enter 发送 · Shift + Enter 换行</span><span>仅演示输入与反馈</span></div></form></section><aside class="margin-notes"><section class="note-section"><h2 class="section-label">正在进行 <small>01</small></h2><button class="recent-item" data-action="task-01">${icon("tasks")}<span><strong>整理界面设计语言</strong><small>进行中 · 刚刚更新</small></span></button></section><section class="note-section"><h2 class="section-label">近期产物</h2><button class="recent-item" data-action="open-artifact">${icon("file")}<span><strong>界面设计语言 v0.1</strong><small>文档 · 今天 09:41</small></span></button><button class="recent-item" data-action="concept">${icon("file")}<span><strong>整体视觉概念图</strong><small>参考图 · 昨天</small></span></button></section><section class="note-section"><h2 class="section-label">快捷操作</h2><div class="quick-links"><button data-action="new-task">${icon("plus")}创建任务</button><button data-action="search">${icon("search")}查找内容</button></div></section></aside></div>`;
}
function tasksView() {
  const shown = tasks.filter(
    (t) => taskFilter === "全部" || t.state === taskFilter,
  );
  return `${heading("任务", "TASKS", "查看目标、执行状态与结果。", button(icon("plus") + " 创建任务", "new-task", true))}<div class="tabs" role="group" aria-label="任务筛选">${["全部", "进行中", "待决定", "已完成", "已停止"].map((x) => `<button class="tab ${taskFilter === x ? "active" : ""}" data-task-filter="${x}" aria-pressed="${taskFilter === x}">${x}</button>`).join("")}</div><div class="table-wrap"><table><thead><tr><th>任务</th><th>状态</th><th>更新于</th><th>操作</th></tr></thead><tbody>${shown.map((t) => `<tr><td>${escapeHTML(t.title)}<small>${escapeHTML(t.desc)}</small></td><td>${state(t.state)}</td><td><time>${t.date}</time></td><td><button class="text-button" data-expand-task="${t.id}" aria-expanded="false" aria-controls="detail-${t.id}">展开 ↓</button></td></tr><tr class="task-detail-row"><td colspan="4"><div class="list-drawer" id="detail-${t.id}" inert aria-hidden="true"><div class="drawer-clip"><div class="drawer-content"><span class="small-label">任务详情</span><h3>${escapeHTML(t.title)}</h3><p>${escapeHTML(t.desc)}</p><p>目标：保持信息结构清楚，让每一个操作有稳定、可见的反馈。</p><span class="muted">样式示例 · 未连接后端</span></div></div></div></td></tr>`).join("")}</tbody></table></div>${shown.length ? "" : '<div class="empty">这里暂时没有任务。</div>'}<p class="table-note">${shown.length} 项任务 · 示例内容，操作仅在当前预览中生效</p>`;
}
function memoryView() {
  return `${heading("记忆", "MEMORY", "摘要、承诺与事实来源。")}<div class="tabs" role="group" aria-label="记忆分类">${["摘要", "承诺", "世界事实"].map((x) => `<button class="tab ${memoryFilter === x ? "active" : ""}" data-memory-filter="${x}" aria-pressed="${memoryFilter === x}">${x}</button>`).join("")}</div><div class="split-page"><section>${memoryFilter === "摘要" ? `<article class="record"><div class="record-meta">01 / DESIGN DIRECTION</div><h3>一个安静的私人工作空间</h3><p>用旧网页的方式组织信息。正文保持清晰，界面的媒介感来自平直边界、稀疏的双色标记和输入时的即时回应。</p><div class="record-actions"><button class="text-button" data-action="memory-source">查看来源 →</button><span class="muted">更新于今天 09:41</span></div></article><article class="record"><div class="record-meta">02 / CURRENT CONTEXT</div><h3>先完成样式，再确定技术实现</h3><p>当前阶段只探索布局、视觉与动效。页面中的内容和业务状态均为示例，后续依据完整技术选型实现。</p><button class="text-button" data-action="memory-source">查看来源 →</button></article>` : memoryFilter === "承诺" ? `<article class="record"><div class="record-meta">COMMITMENT / OPEN</div><h3>完成样式稿后交 Master 复核</h3><p>先观察主要页面的阅读节奏，再微调组件和交互动效。</p><button class="text-button" data-action="resolve-commitment">标记完成 →</button></article>` : `<article class="record"><div class="record-meta">PROJECT / 示例</div><h3>PERRI 界面探索</h3><p>当前阶段：视觉样式设计<br>设计方向：被模拟的旧互联网<br>参考资料：整体视觉概念图、动效分镜</p><button class="text-button" data-action="memory-source">查看事实来源 →</button></article>`}</section><aside><h2 class="section-label">关于记忆</h2><p class="quiet-note">摘要保存对话中的背景。<br>承诺记录需要继续跟进的事。<br>世界事实描述对象与它们的关系。</p><p class="muted">这是一组用于排版的示例。</p></aside></div>`;
}
function artifactsView() {
  return `${heading("产物", "ARTIFACTS", "工作留下的结果，按时间归档。")}<div class="table-wrap"><table><thead><tr><th>名称</th><th>类型</th><th>来源</th><th>操作</th></tr></thead><tbody><tr><td>界面设计语言 · v0.1<small>布局、视觉与动效的共同约定</small></td><td>文档</td><td>整理界面设计语言</td><td><button class="text-button" data-action="open-artifact">查看 →</button></td></tr><tr><td>整体视觉概念图<small>暖白底色与文档式排版</small></td><td>图片</td><td>视觉参考</td><td><button class="text-button" data-action="concept">查看 →</button></td></tr><tr><td>动效分镜<small>接触、按下、释放与结果</small></td><td>图片</td><td>视觉参考</td><td><button class="text-button" data-action="storyboard">查看 →</button></td></tr></tbody></table></div><p class="table-note">3 项示例产物 · 本轮通过本地参考文件演示查看效果</p>`;
}
function attentionView() {
  return `${heading("待处理", "ATTENTION", "需要你的判断时，在这里停一下。")}${pendingAttention ? `<div class="split-page"><section><article class="record"><div class="record-meta">DECISION / 待决定</div><h3>选择界面的默认动效强度</h3><p>标准模式保留轻微的边缘分层；减弱模式只保留状态变化。你可以先在动效样本里感受两者的区别。</p><div class="record-actions">${button("查看选项", "decision", true)}<a class="text-button" href="#motion">先看动效 →</a></div></article><article class="record"><div class="record-meta">AUTHORIZATION / 待授权</div><h3>将设计笔记写入工作目录</h3><p>示例操作：保存一份整理后的设计笔记。授权前展开具体操作、目标与范围。</p>${button("查看操作", "authorization")}</article></section><aside><h2 class="section-label">等待你的回应 <small>02</small></h2><p class="quiet-note">决定与授权分别呈现。操作对象、范围和结果放在一起，便于阅读。</p></aside></div>` : '<div class="empty">✓ 示例事项已处理。<br>当前没有需要回应的事项。</div>'}`;
}
function settingsView() {
  return `${heading("设置", "SETTINGS", "外观、动效与助手配置。")}<div class="split-page"><section><h2 class="section-title">外观与体验</h2><div class="setting-row"><div><h3>页面表现</h3><p>分别复核基础布局和完整美学。</p></div><div class="segmented" aria-label="页面表现">${[
    ["wireframe", "布局线稿"],
    ["styled", "完整样式"],
  ]
    .map(
      ([v, l]) =>
        `<button data-appearance="${v}" class="${appearance === v ? "active" : ""}" aria-pressed="${appearance === v}">${l}</button>`,
    )
    .join(
      "",
    )}</div></div><div class="setting-row"><div><h3>动效强度</h3><p>系统减少动态效果的偏好始终优先。</p></div><div class="segmented" aria-label="动效强度">${[
    ["standard", "标准"],
    ["reduced", "减弱"],
    ["off", "关闭"],
  ]
    .map(
      ([v, l]) =>
        `<button data-motion="${v}" class="${motion === v ? "active" : ""}" aria-pressed="${motion === v}">${l}</button>`,
    )
    .join(
      "",
    )}</div></div><div class="setting-row"><div><h3>暖白 / 墨色 / 蓝与浅蓝</h3><p>蓝与浅蓝用于常规交互；红色留给失败、重大设置变更与重点标记。</p><div class="theme-preview">${["#f5f2ea", "#fffcf6", "#262b31", "#285ea6", "#8bbde0"].map((c) => `<span class="swatch" style="background:${c}" title="${c}"></span>`).join("")}</div></div><a class="text-button" href="#motion">观察组件 →</a></div><h2 class="section-title">助手配置</h2><div class="setting-row"><div><h3>指令草稿</h3><p>编辑草稿 → 复核变更 → 应用配置。</p></div>${button("预览草稿样式", "settings-draft")}</div></section><aside><h2 class="section-label">本轮范围</h2><p class="quiet-note">外观选项只改变当前样式稿。<br>助手配置仅展示草稿与应用状态，不连接真实服务。</p></aside></div>`;
}
let sampleScheme = -1;
const motionStudies = [
  ["attention", "通知", "铃侧短轮廓与底缘先后显影；铃体、铃舌原位不动"],
  ["search", "搜索", "圆环局部与柄端采样；不放大镜片、不添加十字"],
  ["send", "发送", "箭身短段与箭翼局部错位；箭头保持完整"],
  ["chat", "对话", "气泡右边缘、底缘与文字短线的局部"],
  ["tasks", "任务", "夹板边缘与勾选笔画的短段"],
  ["memory", "记忆", "书脊及页面外缘的局部"],
  ["file", "产物", "纸页边缘与折角轮廓的短段"],
  ["settings", "设置", "轨道和调节点的局部；节点不移动"],
  ["plus", "创建", "横纵笔画的端部"],
  ["motion", "动效", "两层窗口边缘的局部"],
];
function motionView() {
  return `${heading("信号采样", "", "本体始终稳定；移入、键盘聚焦或点击右侧样本，观察有限变化。")}
<div class="motion-intro"><p>左侧为无信号的本体，右侧为同一轮廓派生的片段。片段只改变自身的位移、透明度和线宽。</p><div class="sample-options" role="group" aria-label="采样方案">${["自动", "方案一", "方案二", "方案三", "方案四"].map((label, i) => `<button class="text-button" data-sample-scheme="${i - 1}" aria-pressed="${i - 1 === sampleScheme}">${label}</button>`).join("")}</div><p id="sample-status" role="status">${sampleScheme < 0 ? "自动选择" : `方案 ${sampleScheme + 1}`} · 每次交互开始时选定，播放中不再改变</p></div>
<div class="comparison-grid">${motionStudies.map(([name, label, description]) => `<section class="comparison-cell"><div class="comparison-title"><h2>${label}</h2></div><div class="comparison-pair"><button class="study-trigger static-sample" data-action="icon-demo" aria-label="${label}静态本体">${icon(name)}<span>静态本体</span></button><button class="study-trigger" data-action="icon-demo" aria-label="${label}信号采样">${icon(name)}<span>信号采样</span></button></div><p>${description}</p></section>`).join("")}</div>
<h2 class="section-title">实际尺寸与操作</h2><div class="icon-study">${["attention", "search", "send"].map((name) => `<button data-action="icon-demo" aria-label="${name}小尺寸采样"><span class="small-icon">${icon(name)}</span>16 px</button>`).join("")}</div>
<div class="motion-grid"><section class="motion-cell"><h3>按下与释放</h3>${button(icon("send") + " 按住试试", "press-demo")}<p>本体不缩小；按下清理片段，有效激活立即响应。</p></section><section class="motion-cell"><h3>处理中 → 完成</h3>${button("运行示例", "run-success")}<p>业务状态另行表达，不以采样表示成功。</p></section><section class="motion-cell"><h3>处理中 → 失败</h3>${button("失败示例", "run-error")}<p>失败使用红色和明确文字。</p></section><section class="motion-cell"><h3>面板展开</h3>${button("展开面板", "panel-demo")}<p>内容显影与状态独立。</p></section><section class="motion-cell"><h3>键盘焦点</h3>${button("Tab 到这里", "focus-demo")}<p>同次悬停与聚焦合并，焦点框保留。</p></section><section class="motion-cell"><h3>不可用</h3><button class="button" disabled>${icon("send")} 不可用</button><p>禁用不采样。</p></section></div><a class="text-button" href="#settings">调整动效强度 →</a>`;
}

const views = {
  conversation,
  tasks: tasksView,
  memory: memoryView,
  artifacts: artifactsView,
  attention: attentionView,
  settings: settingsView,
  motion: motionView,
};
function openDialog(title, html) {
  window.signalController?.clearAll();
  document.querySelector("#dialog-title").textContent = title;
  document.querySelector("#dialog-content").innerHTML = html;
  if (!dialog.open) dialog.showModal();
}
let toastTimer;
function toast(s) {
  const el = document.querySelector("#toast");
  el.textContent = s;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 2600);
}
function restoreMessages() {
  const target = document.querySelector("#messages");
  for (const m of sentMessages) {
    const article = document.createElement("article");
    article.className = "message";
    article.innerHTML = `<div class="avatar">M</div><div><div class="message-meta"><strong>Master</strong><time>${m.time}</time></div><p style="white-space:pre-wrap">${escapeHTML(m.text)}</p><div class="message-foot">仅添加到样式预览 · 未提交后端</div></div>`;
    target.append(article);
  }
}
function searchResults(query = "") {
  const items = pages.filter((p) => p[1].includes(query.trim()));
  document.querySelector("#search-results").innerHTML = items.length
    ? items
        .map(
          ([id, label]) =>
            `<button class="search-result" data-go="${id}"><span>${label}</span><span>打开页面 →</span></button>`,
        )
        .join("")
    : '<p class="empty">没有匹配的页面。</p>';
}
const actions = {
  "file-style-toggle": (el) => {
    const card = document
      .querySelector(".artifact-strip")
      .classList.toggle("artifact-card-trial");
    el.setAttribute("aria-pressed", String(card));
    el.textContent = card ? "返回文件条目" : "对照卡片";
  },
  "surface-toggle": (el) => {
    window.signalController?.clearAll();
    const off = document.body.classList.toggle("plain-surface");
    el.textContent = "模拟动效：" + (off ? "关" : "开");
    el.setAttribute("aria-pressed", String(!off));
  },
  "theme-toggle": () =>
    setTheme(
      document.documentElement.dataset.theme === "dark" ? "light" : "dark",
    ),
  close: () => dialog.close(),
  search: () => {
    openDialog(
      "查找内容",
      '<label class="field-label" for="search-input">搜索样式稿中的页面</label><input class="field" id="search-input" placeholder="试试「任务」或「记忆」" autofocus><div id="search-results"></div><p class="dialog-description">仅搜索本样式稿页面。</p>',
    );
    searchResults();
    document.querySelector("#search-input").focus();
  },
  notifications: () =>
    openDialog(
      "通知",
      `<div class="notice ${readNotices ? "read" : ""}">${icon("check")}<div><h3>视觉参考已整理</h3><p>两张概念图已放入本地样式预览。</p><time>示例通知 · 今天 09:30</time></div></div><div class="dialog-actions">${button(readNotices ? "已读" : "标为已读", "read-notices")}</div>`,
    ),
  "read-notices": () => {
    readNotices = true;
    dialog.close();
    document.querySelector(".notification-dot")?.remove();
    toast("示例通知已标为已读");
  },
  "new-task": () =>
    openDialog(
      "创建任务",
      `<form id="task-form"><label for="task-goal" class="field-label">你希望完成什么？</label><textarea class="field" id="task-goal" rows="3" required placeholder="写下一个清楚的目标…"></textarea><p class="dialog-description">本次仅演示创建表单，不提交任务。</p><div class="dialog-actions">${button("取消", "close")}<button class="button primary" type="submit">添加示例任务</button></div></form>`,
    ),
  "open-artifact": () =>
    openDialog(
      "界面设计语言 · v0.1",
      `<div class="record-meta">DOCUMENT / LOCAL PREVIEW</div><h3 class="section-title">旧式表面，清楚的响应</h3><p>页面以段落、栏目和细分隔线建立层级；蓝与浅蓝只在交互边缘短暂出现。</p><p>正文、数字、输入内容始终稳定。按钮不等待动画结束才响应操作。</p><div class="dialog-actions"><a class="button" href="Simulated_Old_Web_Design_Language_v0.1.md" target="_blank" rel="noopener">打开完整规范 ↗</a></div>`,
    ),
  concept: () =>
    openDialog(
      "整体视觉概念图",
      '<a href="概念图/整体视觉概念图.PNG" target="_blank" rel="noopener"><img src="概念图/整体视觉概念图.PNG" alt="整体视觉概念图，包含对话布局、图标与颜色体系" style="width:100%;display:block"></a><p class="dialog-description">点击图片查看原图。</p>',
    ),
  storyboard: () =>
    openDialog(
      "动效分镜",
      '<a href="概念图/动效分镜.PNG" target="_blank" rel="noopener"><img src="概念图/动效分镜.PNG" alt="按钮从默认、悬停、按下到释放与结果的动效分镜" style="width:100%;display:block"></a>',
    ),
  "memory-source": () =>
    openDialog(
      "来源摘录",
      '<div class="record-meta">MASTER / 示例对话</div><p>“本次只是设计样式，不是新做前端。后续会根据这一套 UI，提供完整的技术选型去实现。”</p><p class="dialog-description">以来源摘录和关联入口呈现记忆依据。</p>',
    ),
  "resolve-commitment": () =>
    openDialog(
      "完成承诺",
      `<p>将“完成样式稿后交 Master 复核”标记为完成？</p><p class="dialog-description">仅演示确认与完成状态。</p><div class="dialog-actions">${button("取消", "close")}${button("确认完成", "commitment-done", true)}</div>`,
    ),
  "commitment-done": () => {
    dialog.close();
    toast("示例承诺已完成");
    const el = document.querySelector('[data-action="resolve-commitment"]');
    if (el) {
      el.textContent = "✓ 示例已完成";
      el.disabled = true;
    }
  },
  decision: () =>
    openDialog(
      "选择动效强度",
      `<p>默认使用哪一种反馈？</p><div class="dialog-actions">${button("减弱", "choose-reduced")}${button("标准", "choose-standard", true)}</div><p class="dialog-description">这里只演示选项选择，不提交真实决定。</p>`,
    ),
  "choose-standard": () => chooseMotion("standard"),
  "choose-reduced": () => chooseMotion("reduced"),
  authorization: () =>
    openDialog(
      "复核操作范围",
      `<div class="record-meta">WRITE / 示例操作</div><h3 class="section-title">保存设计笔记</h3><p>目标：当前项目的设计目录<br>范围：新增一份 Markdown 笔记<br>内容：整理后的布局与组件约定</p><p class="dialog-description">这是一条授权样式示例，不会写入文件。</p><div class="dialog-actions">${button("拒绝", "reject-demo")}${button("允许本次", "approve-demo", true)}</div>`,
    ),
  "approve-demo": () => {
    dialog.close();
    toast("已选择允许本次 · 示例操作");
  },
  "reject-demo": () => {
    dialog.close();
    toast("已选择拒绝 · 示例操作");
  },
  "settings-draft": () =>
    openDialog(
      "助手指令 · 草稿",
      `<form id="draft-form"><label class="field-label" for="draft-text">指令内容</label><textarea class="field" id="draft-text" rows="5">${escapeHTML(draftText)}</textarea><p class="dialog-description">草稿尚未应用 · 当前为样式示例。</p><div class="dialog-actions">${button("取消", "close")}<button type="submit" class="button primary">复核变更</button></div></form>`,
    ),
  "apply-draft": () => {
    dialog.close();
    toast("示例配置已应用 · 未修改真实设置");
  },
  "icon-demo": () => {},
  "press-demo": () => toast("有效点击 · 已释放并对位"),
  "focus-demo": () => toast("键盘与鼠标使用同一套反馈"),
  "panel-demo": () =>
    openDialog(
      "一层轻轻揭开的页面",
      '<p>边界先锁定位置，内容按三段水平区域重新显影。</p><p class="dialog-description">Esc 关闭；关闭后焦点回到触发按钮。打开与关闭不等待动效结束。</p>',
    ),
  "run-success": (el) => runExample(el, false),
  "run-error": (el) => runExample(el, true),
};
function chooseMotion(value) {
  motion = value;
  applyAppearance();
  dialog.close();
  toast(
    "已选择" + (value === "standard" ? "标准" : "减弱") + "动效 · 仅本地预览",
  );
}
function applyAppearance() {
  window.signalController?.clearAll();
  document.body.classList.toggle("wireframe", appearance === "wireframe");
  document.body.classList.toggle("motion-off", motion === "off");
  document.body.classList.toggle("motion-reduced", motion === "reduced");
}
function runExample(el, error) {
  if (el.disabled) return;
  el.disabled = true;
  el.className = "button scanning";
  el.textContent = "演示处理中…";
  setTimeout(() => {
    if (!el.isConnected) return;
    el.disabled = false;
    el.className = "button " + (error ? "error" : "success");
    el.textContent = error ? "! 失败 · 重试" : "✓ 完成 · 再试";
    el.closest(".motion-cell").querySelector("p").textContent = error
      ? "示例错误：内容暂时无法读取。点击重试。"
      : "示例运行完成，结果保持可见。";
  }, 1200);
}
document.addEventListener("click", (e) => {
  const target = e.target.closest("button,a");
  if (!target) return;
  if (target.dataset.action) {
    if (
      target.closest("form") &&
      target.type === "submit" &&
      !target.classList.contains("primary")
    )
      e.preventDefault();
    else if (target.tagName === "BUTTON" && target.hasAttribute("data-action"))
      e.preventDefault();
    const action = target.dataset.action;
    if (action.startsWith("task-")) {
      const t = tasks.find((t) => t.id === action.slice(5));
      if (t)
        openDialog(
          t.title,
          `<div class="record-meta">TASK / ${t.id}</div><p>${escapeHTML(t.desc)}</p>${state(t.state)}<h3 class="section-title">目标与结果</h3><p>保持信息结构清楚，让每一个操作有可见、稳定的反馈。</p><p class="dialog-description">任务详情样式示例。</p>`,
        );
    } else actions[action]?.(target);
  }
  if (target.dataset.sampleScheme) {
    sampleScheme = Number(target.dataset.sampleScheme);
    signalController.setScheme(sampleScheme);
    document
      .querySelectorAll("[data-sample-scheme]")
      .forEach((el) => el.setAttribute("aria-pressed", String(el === target)));
    document.querySelector("#sample-status").textContent =
      target.textContent + " · 下次接触时使用";
  }
  if (target.dataset.expandTask) {
    const expanded = target.getAttribute("aria-expanded") !== "true";
    const drawer = document.getElementById(
      "detail-" + target.dataset.expandTask,
    );
    target.setAttribute("aria-expanded", String(expanded));
    target.textContent = expanded ? "收起 ↑" : "展开 ↓";
    drawer.inert = !expanded;
    drawer.setAttribute("aria-hidden", String(!expanded));
    drawer.classList.toggle("open", expanded);
  }
  if (target.dataset.taskFilter) {
    taskFilter = target.dataset.taskFilter;
    render();
  }
  if (target.dataset.memoryFilter) {
    memoryFilter = target.dataset.memoryFilter;
    render();
  }
  if (target.dataset.appearance) {
    appearance = target.dataset.appearance;
    applyAppearance();
    render();
  }
  if (target.dataset.motion) {
    motion = target.dataset.motion;
    applyAppearance();
    render();
  }
  if (target.dataset.go) {
    dialog.close();
    location.hash = target.dataset.go;
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "search-input") searchResults(e.target.value);
});
document.addEventListener("submit", (e) => {
  e.preventDefault();
  if (e.target.id === "message-form") {
    const input = document.querySelector("#message-input");
    if (!input.value.trim()) {
      input.focus();
      toast("先写下一点内容");
      return;
    }
    sentMessages.push({
      text: input.value.trim(),
      time: new Date().toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    render();
    document.querySelector("#message-input").focus();
    document
      .querySelector("#message-form")
      .scrollIntoView({ block: "nearest" });
    toast("消息已加入样式预览 · 未发送");
  }
  if (e.target.id === "task-form") {
    const goal = document.querySelector("#task-goal").value.trim();
    if (!goal) return;
    tasks.unshift({
      id: String(Date.now()),
      title: goal,
      desc: "本地创建的示例任务",
      state: "进行中",
      date: "刚刚",
    });
    taskFilter = "全部";
    dialog.close();
    location.hash = "tasks";
    render();
    toast("已添加示例任务");
  }
  if (e.target.id === "draft-form") {
    const value = document.querySelector("#draft-text").value;
    draftText = value;
    openDialog(
      "复核配置变更",
      `<div class="critical-change"><strong>重大设置变更</strong><p class="dialog-description">助手指令会影响后续行为。复核以下内容后再应用；本次仅为样式演示。</p></div><p style="white-space:pre-wrap">${escapeHTML(value)}</p><div class="dialog-actions">${button("返回编辑", "settings-draft")}<button class="button critical" data-action="apply-draft">应用示例</button></div>`,
    );
  }
});
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    actions.search();
  }
  if (
    e.target.id === "message-input" &&
    e.key === "Enter" &&
    !e.shiftKey &&
    !e.isComposing
  ) {
    e.preventDefault();
    document.querySelector("#message-form").requestSubmit();
  }
});
window.addEventListener("hashchange", render);
render();

// One controller owns all decoration and its lifecycle; business listeners stay native.
window.signalController = PhaseSignalMotion.createController({
  document,
  window,
  geometry,
  onSample: ({ scheme, count, duration }) => {
    const status = document.querySelector("#sample-status");
    if (status)
      status.textContent = `方案 ${scheme + 1} · ${count} 个派生片段 · ${duration} ms · 本体不变`;
  },
});

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const toggle = document.querySelector('[data-action="theme-toggle"]');
  toggle.textContent = theme === "dark" ? "浅色模式" : "深色模式";
  toggle.setAttribute("aria-pressed", String(theme === "dark"));
  try {
    localStorage.setItem("phase-ui-theme", theme);
  } catch {}
}
let savedTheme = "light";
try {
  savedTheme = localStorage.getItem("phase-ui-theme") || "light";
} catch {}
setTheme(savedTheme === "dark" ? "dark" : "light");
