# 给AI装上眼睛：用MCP Server实现网站自动体检

你的网站健康吗？

这个问题，大多数开发者只在出了问题之后才会去想。SEO评分多少、有没有死链、无障碍访问做得怎么样、安全头配了没有——这些事情重要，但没人喜欢一个一个手动去查。

如果你的AI助手能直接帮你做这件事呢？不是让你去开Lighthouse跑报告，不是让你打开十个Chrome插件，而是你在对话框里说一句"帮我查一下这个网站的SEO"，几秒钟后结果就摆在面前。

这就是 webcheck-mcp 在做的事。

## 什么是 MCP Server

MCP（Model Context Protocol）是Anthropic推出的开放协议，让AI模型可以调用外部工具。简单理解：MCP Server就是AI的"插件"，给AI赋予它原本不具备的能力。

webcheck-mcp 是一个专门做网站健康检查的MCP Server。它给AI装上了"眼睛"，让AI能够主动抓取网页、分析HTML、检测问题，然后用人话告诉你哪里有毛病。

## 安装：30秒搞定

不需要API Key，不需要注册账号，不需要任何配置文件。

**Claude Code 用户：**

```bash
claude mcp add webcheck -- npx webcheck-mcp
```

**Claude Desktop 用户：**

在 `claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "webcheck": {
      "command": "npx",
      "args": ["webcheck-mcp"]
    }
  }
}
```

**Cursor / Windsurf 用户：**

在MCP配置中添加同样的内容即可。

装完之后，你的AI助手就多了5个工具：

| 工具 | 功能 |
|------|------|
| `check_website` | 全面体检：SEO评分、性能、安全头、图片分析 |
| `check_seo` | 深度SEO审计：标题、描述、标题层级、Open Graph、结构化数据 |
| `check_accessibility` | 无障碍扫描：alt文本、ARIA地标、标题层级、表单标签 |
| `find_broken_links` | 死链检测：并行检查页面上所有链接，报告404和重定向 |
| `compare_pages` | 双页对比：两个URL的各项指标并排比较 |

## 场景一：上线前检查

这是最常见的场景。项目要上线了，PM问你"SEO做了吗？无障碍考虑了吗？"你心里没底。

直接跟AI说：

> "帮我全面检查一下 https://my-startup.com 的网站健康状况"

AI调用 `check_website`，返回结果：

```
URL: https://my-startup.com
响应时间: 342ms (fast)
内容大小: 48,203 bytes

安全检查:
  HTTPS: 是
  HSTS: 否
  CSP: 否
  X-Frame-Options: 否

SEO评分: 62/100

问题:
  - Meta描述缺失
  - 缺少H1标题
  - 3张图片缺少alt文本
  - 内容偏少 (287词)

建议:
  - 添加canonical URL防止内容重复
  - 添加JSON-LD结构化数据以获得富搜索结果
  - 添加Open Graph标签以优化社交分享
```

62分，不及格。但好消息是，每一条问题都有明确的修复方向。你不需要去研究"SEO最佳实践"，工具已经把该做的事列出来了。

继续追问无障碍：

> "再查一下无障碍问题"

AI调用 `check_accessibility`：

```
无障碍评分: 72/100

图片:
  总计: 12张
  缺少alt属性: 3张
  装饰性图片(空alt): 2张

标题层级:
  h1: ["我们的产品"]
  h2: ["功能特性", "定价", "常见问题"]
  层级跳跃: 无
  结构合理: 是

表单:
  输入框总计: 4个
  缺少关联label: 1个

ARIA:
  地标角色: ["main (semantic)", "navigation (semantic)", "banner (semantic)"]
  aria-label数量: 3
  跳转链接: 无
  主内容地标: 有

问题:
  - 3张图片没有alt属性
  - 1个表单输入框可能缺少关联的label

建议:
  - 添加"跳转到主内容"链接以优化键盘导航
```

3张图片没写alt，1个表单输入没有label，没有skip link。这些都是上线前10分钟就能修的事情，但如果没人提醒，很可能就带着问题上线了。

## 场景二：竞品对比

你想知道自己的网站跟竞品差在哪里。以前你得分别打开两个网站、跑两次Lighthouse、手动对比数据。现在一句话搞定：

> "对比一下 https://my-shop.com 和 https://competitor.com 的SEO"

AI调用 `compare_pages`，给你一张对比表：

```
页面对比: my-shop.com vs competitor.com

               my-shop.com    competitor.com
SEO评分          58             81
响应时间        1,240ms         380ms
HTTPS            是              是
标题长度        22字符          54字符
Meta描述         无             156字符
H1标题           无              有
结构化数据       无              有
Open Graph       无              有
图片总数         8               15
缺少alt          4               1

差距最大的地方:
  1. 对手有完整的meta描述，你没有
  2. 对手响应速度快3倍
  3. 对手的结构化数据可以在搜索结果中展示富摘要
```

差距一目了然。你不需要SEO专家来告诉你该做什么，数据已经说明了一切。

## 场景三：批量审计

如果你维护多个站点，或者你是做技术咨询的，需要批量检查客户的网站，`find_broken_links` 非常实用。

> "检查 https://docs.example.com 上的所有链接"

AI调用 `find_broken_links`：

```
URL: https://docs.example.com
页面链接总数: 87
已检查: 50 (上限)

死链 (3个):
  - https://docs.example.com/api/v1/auth  → 404
  - https://old-cdn.example.com/sdk.js     → 连接超时
  - https://docs.example.com/changelog/2024 → 404

重定向 (5个):
  - http://example.com → https://example.com (HTTP升级)
  - /docs/quick-start  → /docs/getting-started (路径变更)
  - /blog/announcement → /blog/launch (内容迁移)
  ...

健康链接: 42个

总结: 在50个已检查链接中发现3个死链。
```

3个死链。对于文档站来说，死链直接影响用户体验和SEO排名。工具帮你精确定位到哪个URL出了问题，修起来很快。

## 它是怎么工作的

webcheck-mcp 的实现思路很直接：

1. 通过HTTP请求抓取目标页面的HTML和响应头
2. 解析HTML，提取title、meta、headings、images、links等关键元素
3. 根据SEO、无障碍、安全等维度的最佳实践进行评分
4. 死链检测采用并行批量请求（每批10个），兼顾速度和服务器友好

整个过程不依赖任何第三方API，不需要浏览器渲染，纯HTTP+HTML解析。所以它很快，也没有使用成本。

代码是TypeScript写的，基于 `@modelcontextprotocol/sdk` 构建。如果你想了解MCP Server的开发模式，这个项目的代码量不大，适合作为参考。

## 实际使用建议

**上线检查清单**：在CI/CD流程中，上线前让AI跑一次 `check_website`，SEO评分低于70就阻断发布。不需要写复杂的测试脚本，自然语言描述规则就行。

**周期性巡检**：每周对核心页面跑一次 `find_broken_links`，内容更新、域名迁移、CDN变更都可能导致链接失效。早发现比用户反馈快。

**竞品跟踪**：每月用 `compare_pages` 对比一次你和主要竞品的关键指标，看看差距是在缩小还是在扩大。

**新项目模板验证**：如果你们团队有项目模板，用 `check_seo` 和 `check_accessibility` 验证模板本身的质量，从源头保证每个新项目的起点不低。

## 总结

webcheck-mcp 做的事情并不复杂——抓取网页、分析HTML、输出报告。但它的价值在于：把这些原本需要你手动操作的事情，变成了AI可以自主完成的能力。

你不再需要记住"meta描述应该多长""H1应该有几个""哪些安全头必须配"这些细节。工具记住了，AI来执行，你只需要看结果、做决策。

给AI装上眼睛，让它替你盯着网站的健康状况。这才是MCP工具链的正确打开方式。

---

**工具链接：**

- npm: `npm install webcheck-mcp` 或 `npx webcheck-mcp`
- GitHub: [github.com/yifanyifan897645/webcheck-mcp](https://github.com/yifanyifan897645/webcheck-mcp)
- 更多MCP工具和配置指南: [爱发电](https://ifdian.net/a/yifan897645)

---

*本文由 Claude AI 撰写。*
