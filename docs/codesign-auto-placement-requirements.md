# Codesign → Render 自动摆放需求


| 项    | 内容                                                |
| ---- | ------------------------------------------------- |
| 关联能力 | 上下文理解 / 素材平台精准推荐 → 用户确认 → `place_assets` 等在渲染器内执行 |
| 状态   | 草案 — 部分项依赖渲染器能力对齐（见 §11）                          |


---

## 1. 背景与目标

### 1.1 背景

用户在 Web / 桌面端基于项目知识库与对话获得**带真实素材 ID** 的推荐后，可选择**在已关联的 Windows 渲染器中自动摆放**。摆放结果需可预览、可回滚、可审计，并与现有「深链定位 / 工作集」策略一致。

### 1.2 目标

- 在**不依赖建筑轴网**、**不依赖材质语义面**的前提下，提供一套**默认可用、可解释、可降级**的自动摆放规则。
- 云端（Codesign）输出**可校验的 Placement Plan**；渲染器本地执行器完成**几何求解**，并回传**成功 / 失败原因 / 缩略图或线框预览**（与总架构中的 Action Layer 一致）。

---

## 2. 渲染器现状与约束（输入条件）

以下约束为需求边界，**摆放规则必须兼容**。


| 约束     | 说明                                                                                 |
| ------ | ---------------------------------------------------------------------------------- |
| 无网格    | 场景中**无**建筑轴网 / 模数网格概念；仅有**世界坐标**与**相对（父级）坐标**。                                     |
| 几何表示   | 存在**三角面片**与**法线**信息，可做射线与相交判断。                                                     |
| 数据来源   | 用户可能通过**插件同步**或**手动导入**得到场景；**不保证**材质划分与设计意图一致。                                    |
| 典型数据问题 | 例如**整张桌子与整个房间**在工具链中被视为**同一材质面**，且当前流程下**无法分割**；因此**不能**将「材质面 ID」作为可靠的语义地面 / 桌面标识。 |


**推论**：自动摆放的「支撑面」应定义为 **射线命中的三角面 + 法线判别 + 用户/锚点意图**，而非「选中某材质」。

---

## 3. 设计原则

1. **坐标优先**：优先使用**世界坐标**或**相对已有实例的局部变换**作为契约；「落到地上」通过 `**snap_along_scene_up`**（沿场景 Up 反方向射线）实现，而非绑定材质。
2. **三角几何可信、材质语义不可默认**：命中结果可带 `mesh_instance_id` + `triangle_index`（若引擎可提供），**禁止**要求用户事后拆分材质才能摆放。
3. **歧义显式化**：多层水平面（地面 / 桌面 / 楼板）可能导致射线歧义时，必须输出 **confidence / ambiguity_reason**，默认**不静默摆错**。
4. **可降级**：规则应支持 `strict | relax | manual_only`，失败时进入**预览不提交**或**仅加入待布置列表**。
5. **与素材平台一致**：Placement Plan 中资产引用使用**稳定 SKU / asset_uid**，与 Asset Graph 一致。
6. **空间意图先于坐标**：在生成每条 `item` 的最终变换之前，必须先完成 **目标区域（Target Region）可解析指派**（见 §4）；**禁止**对大批量 SKU 仅依赖「未说明范围的默认世界原点/单点」完成自动落地。
7. **大批量先定序再撒点**：超过配置阈值（如几十 / 上百件）时，须在 **拓扑顺序或分级策略**（见 §8.1、§16）下执行，避免小件先占满大件 footprint；与 §4.8 工具轨 **互补**（工具轨解决「一次生成多实例」，编排解决「多批 / 多类动作的先后与失败策略」）。

---

## 4. 空间意图与目标区域指派（规定）

本章回答：**Codesign 如何从「别墅 + 花园」等项目上下文，为每个 SKU（含大批量）得到合法、可执行的摆放范围**，并与 §7（L2）中的「搜索范围」衔接。

### 4.1 总原则


| 规则             | 说明                                                                                                                                                                                                                                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **结构化优先**      | 「别墅 / 花园 / 客厅」等**自然语言不得**作为渲染器唯一输入；必须落为 **Zone Catalog（区域目录）** + **每条 SKU 或 SKU 组的 `target_region_ref`**。                                                                                                                                                                                                                         |
| **可解析性**       | 对任意待摆放 `item`，下列至少 **其一** 在下发前必须为真，否则 **不得** 进入自动执行（只能进入待办 / 预览 / 阻塞确认）： ① `placement_volume_id`（渲染器内已注册体积） ② `target_zone_id` + 该 zone 已绑定 **世界坐标包围体** 或 **placement_volume_id** ③ `parent_instance_id`（含 socket / 局部变换，适用于 `surface_placed` 等） ④ `explicit_seed_transform` + `**scope_volume_id`**（种子点必须在某个体积内，禁止无 scope 的全局撒点） |
| **禁止默认「全场单区」** | 当用户指令为「全部摆进场景」且 **未** 提供任何 zone/volume 时，**不得** 假设「整个场景 AABB = 唯一地面搜索区」（易与外墙外、泳池底、二层楼板投影等冲突）。必须先 **补齐空间意图**（见 4.5 人机协同）。                                                                                                                                                                                                          |
| **室内 / 外分治**   | `interior` 与 `exterior`（花园）zone **不得**在无用户确认下合并为同一 `placement_volume`，除非 Plan 显式声明 `zone_merge_ack: true`（用户已确认）。                                                                                                                                                                                                                 |


### 4.2 Zone Catalog（项目 / 会话级结构化对象）

Codesign 与渲染器、知识库之间维护逻辑上的 **区域目录**（可存会话快照或项目资源）：


| 字段                     | 必填  | 说明                                                                                                                            |
| ---------------------- | --- | ----------------------------------------------------------------------------------------------------------------------------- |
| `zone_id`              | 是   | 稳定 ID（UUID 或 `project_slug + label`）                                                                                          |
| `label`                | 是   | 展示名：客厅、主卧、前花园等                                                                                                                |
| `kind`                 | 是   | `interior_floor`                                                                                                              |
| `geometry`             | 条件  | **其一**：`placement_volume_id`（推荐）；或 `world_aabb`；或 `world_obb`（含中心、轴、半长）；或 `polygon_2d + height_min/max`（在 `scene_up` 垂直平面内定义） |
| `function_tags`        | 否   | 如 `living`, `bedroom`, `bathroom`, `lawn`, `driveway`，用于与 SKU 标签/分类匹配                                                         |
| `exclusion_volume_ids` | 否   | 泳池、采光井、楼梯洞等需排除的子体积                                                                                                            |
| `max_slope_deg`        | 否   | 室外地面尤其建议填写；超出则该 zone 内 `floor_placed` 降级或拒绝                                                                                   |


**来源优先级（如何得到 zone）**：

1. **渲染器内用户绘制 / 插件同步**：`placement_volume` + 命名 → 同步到 Codesign 的 Zone Catalog。
2. **知识库结构化资料**：任务书 / BIM 轻量摘要 / CSV 房间表 → 映射为 `world_aabb` 或 `polygon_2d`（需约定坐标系与 `scene_up`）。
3. **对话显式创建**：「把前院定义为花园区」→ 生成 `zone_id` 并 **要求用户一次确认**（在视口中框选或选已有 volume）。
4. **无几何时的占位**：仅允许 `zone_id` + `function_tags` **挂起**，**禁止**直接生成大批量 `floor_placed` 的 `world_target`；须走 4.5。

### 4.3 SKU → Zone 指派（Assignment）

在 Zone Catalog 已具备**可执行几何**的前提下，为每个推荐 SKU（或「搭配包」内子项）生成 `**target_region_ref`**：

**指派来源优先级（从高到低）**：

1. **用户显式**：对话中「这些灯都放在客厅」、多选 SKU + 选 zone UI、`@区域` 等 → **直接绑定**。
2. **素材 / 搭配元数据**：SKU 带 `intended_zone_tag` 或与 `function_tags` 可判定匹配 → 绑定唯一 zone；**多匹配**时 → **歧义列表**，不自动执行。
3. **方案结构化块**：Agent 输出中每条推荐带 `suggested_zone_id`（必须由 RAG/用户确认过的目录引用，**禁止幻觉 zone_id**）→ 校验存在后绑定。
4. **启发式（弱）**：如「户外灯具」→ `exterior_ground` 或 `path` 类 zone；**仅当**该类 zone 唯一时可用，否则 → 歧义。
5. **未指派**：进入 `**UNASSIGNED`** 队列，**不参与**自动 `place_assets` 执行，直到用户为整批或子批指定 zone。

**组级指派**：同一「套餐」可共享 `target_region_ref`；组内再通过 L3（socket / 相对父级）细分，减少 300 次重复填 zone。

### 4.4 Zone 内候选位生成（Codesign 或执行器分工）

规定 **谁**负责在 zone 内产生初始 `translation` 种子（可写在协议里二选一或并存）：

- **云端生成种子**：在 `world_aabb` / 多边形水平投影内做 **泊松盘 / 网格抖动 / 沿 path 采样**，再下发 `world_target`；执行器只做 `snap_down` 与碰撞修正。  
- **执行器内撒点**：仅下发 `placement_volume_id` + SKU 列表 + 策略 `scatter_policy`；由渲染器在体积内采样（需规定随机种子 `rng_seed` 以保证幂等调试）。

无论哪种，`horizontal_layer_policy`、碰撞与歧义仍遵守 §10、§7。

### 4.5 人机协同（针对「帮我把这些全部摆进场景」）

当用户**未**结构化指定区域时，**必须**触发以下之一（产品可配置默认顺序）：


| 策略            | 行为                                                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| **A. 分区确认卡片** | 拉取当前项目 Zone Catalog；若为空，引导 **在渲染器中创建 volume** 或 **上传/引用带房间边界的资料**；展示「室内 n 区 + 花园 1 区」与 **SKU 数量分布预览**，用户确认后再生成 Plan。 |
| **B. 会话默认**   | 使用用户在本会话中 **最近一次已确认的 zone 集合**；若 SKU 中出现未覆盖 `function_tag`，弹出补缺。                                                     |
| **C. 分批执行**   | 先仅处理已指派 zone 的子集；其余保持 **UNASSIGNED**，避免半成场景。                                                                         |


**禁止**：在 zone 几何缺失时，用「场景中心点」或「相机下方一点」对 300 个 SKU 做默认 `floor_placed`。

### 4.6 下发前校验（Validator）

`place_assets` 提交前，Codesign **必须**通过校验（失败则阻断或拆分批次）：

- 每个 `item` 的 `target_region_ref` 可解析为 **具体几何或 `placement_volume_id`**。  
- `interior` SKU（如马桶、浴缸）**不得**绑定 `exterior_ground`，除非 SKU 元数据标明户外款且用户确认。  
- `zone_fill` / `line_placed` **必须**带 `path_id` 或 `fill_region_id`，不得裸用全场。  
- 可选：`items_per_zone` 超过阈值时要求用户选择 `collision_policy: relax` 或分批。

### 4.7 与 Placement Plan 的衔接字段（逻辑）

在 §12 的 `items[]` 上增加（或等价字段）：

- `target_zone_id`（引用 Zone Catalog）  
- `placement_volume_id`（与 zone 绑定或可覆盖）  
- `assignment_source`：`user_explicit | catalog_tag | agent_structured | heuristic | unassigned_blocked`

`assignment_source: unassigned_blocked` 的条目 **不得**出现在自动执行的同一请求中，除非 `execution_mode: manual_queue_only`。

### 4.8 与路径 / 散布 / 笔刷工具（渲染器原生工作流）

渲染器已具备 **路径、散布、笔刷** 等工具时，Codesign **应优先**通过 **工具编排类动作** 完成大批量沿界/沿带布置，避免对「沿路径 100 棵植物」这类意图下发 **100 条独立 `place_assets` 明细**（除非调试或强逐棵可控需求）。

#### 4.8.1 与现有规则的关系（是否兼容）


| 维度                   | 结论                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **§4 空间意图**          | **兼容**。「花园外围」须落到 `target_zone_id`（如 `exterior_ground` 花园区）+ **路径几何**属于该区或与其 `placement_volume` 有 **包含/贴合** 关系；禁止无 zone 的全局路径。 |
| **L0 `line_placed`** | **语义兼容**：沿路径阵列植物属于 `line_placed` / 类路径填充；**实现上**既可离散实例，也可 **渲染器内部由路径工具一次生成**。                                                 |
| **§4.4 撒点**          | **兼容**：「沿路径采样」已允许；可规定由 **执行器路径工具** 完成采样与实例化，等价于「执行器内撒点」的变体。                                                                   |
| **效率**               | 当前 §12 以 `items[]` 为主；**需在 Action Layer 增补**「路径/散布/笔刷」一类 **聚合动作**（见 4.8.4），否则仅「规则兼容、协议偏重」。                                    |


#### 4.8.2 推荐双轨模式

1. **明细轨**：`place_assets` + 多条 `items`（适合少量、强逐实例编辑）。
2. **工具轨**：`populate_along_path` / `scatter_in_volume` / `brush_stroke`（名称与渲染器 API 对齐）——参数含 **资产集合、数量或密度、随机种子、路径句柄或曲线数据、可选笔刷半径/抖动**，由 **渲染器原生工具链** 执行；回传 `**instance_group_id` / 实例列表摘要** 供 Codesign 与 Asset Graph 关联。
  - `**populate_along_path`** 的 Zod 载荷已落在 `packages/aec-protocol`（`populateAlongPathPayloadSchema`，`action: "populate_along_path"`），与 `actionEnvelopeSchema` / `validateActionEnvelope` 联动校验。

大批量（如 ≥N，N 可配置）且用户显式提到「路径 / 散布 / 笔刷」时，**默认走工具轨**，除非用户要求「每棵可单独撤销」等。

#### 4.8.3 「选 100 个植物 + 沿花园外围画一圈」工作流（规定）

- **植物集合**：100 个 SKU 可为 **显式列表** 或 **带权重的植物池**（`asset_pool_id` + `selection_mode: random_without_replacement | weighted`）；须在 **用户许可的已购/企业库** 内。  
- **路径来源（二选一或组合）**  
  - **用户主导（推荐）**：用户在渲染器中 **用路径工具绘制** 闭合/开放曲线 → 渲染器生成 `**path_id`（会话内稳定）** 或导出 **控制点序列** → Codesign 下发工具轨动作时 **仅引用 `path_id`**，不重复发明路径编辑。  
  - **半自动**：Codesign 根据花园 zone 的 **边界多边形** 自动生成 **偏移曲线**（如距边界内缩 0.5m）→ 下发 `path_polyline`（世界坐标）+ `target_zone_id`；**需用户预览确认**（避免与真实地形/洞口不符）。
- **约束**：路径 **必须** 与 `target_zone_id` 几何校验（端点/采样点在区内或允许的 `tolerance_m` 内）；**排除体积**（泳池、建筑轮廓）与 §4.2 `exclusion_volume_ids` 一致。  
- **落地**：执行器调用 **路径 + 散布**（或合一的「沿路径散布」预设），参数如 `spacing_m | count | offset_from_path | random_yaw | scale_jitter`，并带 `**rng_seed`** 保证可复现与幂等调试。

#### 4.8.4 笔刷工具

- 将笔划视为 **暂存 `stroke_id` + 采样点序列** 或 **执行器内已提交的笔触区域**；Codesign 下发 `**brush_preset_ref`**（密度、半径、资产池、仅铺于 `exterior_ground` 等），与 §4 **zone** 绑定。  
- 笔刷与路径可同时存在不同 `action`；**不得**在无 `target_zone_id` 时全场景笔刷。

#### 4.8.5 Validator 补充

- 工具轨动作 **必须** 含 `target_zone_id`（或与 `path_id` 绑定的 zone 元数据已注册）。  
- `populate_along_path` **必须** 含 `path_id` **或** 可解析的 `path_polyline` + `scene_up`。  
- `**count` ≥ 阈值** 时，若未走工具轨而使用超长 `items[]`，Validator 可 **警告或要求拆分**（产品策略）。

---

## 5. 摆放语义类型（L0）

素材库或推荐服务应为资源标注或可推导下列**语义类型**（枚举值供协议使用）：


| 值                | 含义              | 典型 SKU         |
| ---------------- | --------------- | -------------- |
| `floor_placed`   | 落地，底贴「下方」水平支撑   | 沙发、柜体、雕塑底座     |
| `wall_mounted`   | 贴竖直面，背面法线与墙法线对齐 | 挂画、壁灯          |
| `ceiling_hung`   | 自上方向下或吊顶锚点      | 吊灯、风口          |
| `surface_placed` | 置于另一物体顶面 / 台面   | 花瓶、书本          |
| `line_placed`    | 沿路径或边线阵列        | 栏杆、灯带          |
| `zone_fill`      | 区域填充（铺装、草坪等）    | 模块化地砖          |
| `free_floating`  | 显式世界变换，可选不 snap | 空中装置、舞台吊点      |
| `unknown`        | 无法归类            | 仅导入到默认原点或需用户指定 |


无法可靠归类时 **必须为 `unknown` 或带人工确认**，不得臆造语义。

---

## 6. 几何锚定规则（L1）

### 6.1 场景 Up 轴（补充 · 协议级）

渲染器世界坐标中 **重力 / 「向下」射线方向** 所对应的 **Up 轴** 可能为 **+Y** 或 **+Z**（或其它）。协议与本地执行器须支持：

- **配置项** `scene_up`：`"+Y" | "+Z" | "-Y" | "-Z"` 或**单位向量** `[ux, uy, uz]`（由工程或渲染器配置文件声明）。
- Codesign 下发的 Placement Plan **不得写死**某一轴向；默认取**当前工作集 / 工程**绑定的 `scene_up`。

若尚未实现向量形式，**MVP 可采用四选一枚举**，由产品在渲染器侧文档中写死默认值并在会话中可覆盖。

### 6.2 Snap（沿 Up 反方向落位）

- `**snap_down`**（名称可映射为引擎 API）：从候选位置沿 `**−scene_up`** 发射射线，取**第一个**满足「近似水平」的命中三角（见 6.3）。
- 参数建议：`max_drop_distance`、`horizontal_normal_threshold_deg`（法线与 `scene_up` 夹角 ≤ 阈值视为水平支撑）。
- 资产使用 **pivot / 底点**（SKU 元数据或默认 bbox 底中心）与命中点对齐；是否根据命中法线做 **pitch/roll** 由 `placement_semantic` 决定（落地件通常仅 **yaw**）。

### 6.3 水平面判定

- 命中法线满足水平阈值则视为有效支撑；否则返回错误码 `**SUPPORT_NOT_HORIZONTAL`** 或降级为不 snap。

### 6.4 尺度

- 优先使用 SKU **真实尺寸** 或等比缩放至标注参考尺寸；**默认禁止非等比**，除非用户显式策略 `allow_non_uniform_scale`。

### 6.5 相对坐标

- 若提供 `parent_instance_id` 与 `local_transform`，则**先**应用相对变换，再视策略决定是否对该结果执行 `snap_down`。

---

## 7. 空间与碰撞（L2）


| 规则   | 说明                                                                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 硬碰撞  | 与场景内碰撞体或简化 mesh 检测穿插；`strict` 下失败则 abort 并报告冲突对象 id（若可取得）。                                                                                                    |
| 软净空  | 门洞摆动区、通道宽度等可用**简化体**描述；MVP 可用 **扩展 bbox** 近似。                                                                                                                 |
| 距边界  | 可选 `min_offset_from_wall` 等，依赖**可得的墙/房间简模**或**用户框选区域**；无数据则跳过并标记 `constraint_skipped`。                                                                        |
| 搜索范围 | **每条 item 的候选搜索 / 撒点范围**须受 §4 **目标区域**约束；在技术实现上体现为 `placement_volume_id`、`target_zone_id` 对应几何、用户**选中区域**或**当前相机可见**（仅当显式 `scope: camera_frustum` 且用户确认短时有效）。 |


**说明**：无网格时，**不做**「对齐轴网」；若未来引入可选参考向量，可单列增强项，不作为 MVP 依赖。

---

## 8. 关系与组合（L3）

可选能力，建议第二阶段：

- **socket**：父物体命名挂点 + 子资产偏移 / 朝向。
- **对称 / 阵列**：相对父节点或相对 `focus_point` 的镜像与等距复制。
- **朝向**：如 `face_toward` 目标点（相机目标、沙发中心等）。

关系描述建议使用**结构化 JSON**，不依赖自然语言在渲染器端解析。

### 8.1 拓扑顺序与依赖（大批量必选）

「搭配」隐含 **先主后次、先大后小、先父后子**。与 §4「摆在哪」**无冲突**：§4 约束空间范围，本节约束 **同一 zone 或多 zone 内的执行顺序**。


| 规则                                  | 说明                                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **禁止默认随机顺序**                        | 对大批量 `place_assets`（或未走 §4.8 工具轨的长 `items[]`），执行器 **不得** 在无策略时按任意随机顺序落位，以免小件、边几先占位导致床、沙发等 **无法再摆**。                      |
| **分级 `placement_tier`（建议 SKU 元数据）** | 如 `0` 建筑/固定构造、`1` 主家具、`2` 配饰、`3` 纯装饰；同区内 **tier 升序**执行（数值小的先摆）。                                                          |
| **footprint 优先**                    | 同 tier 内建议按 **水平投影占地降序**（大先于小）；占地可用 SKU `footprint_aabb_m2` 或包围盒近似。                                                      |
| **显式依赖**                            | 床头柜相对床、台灯相对床头柜：通过 `**parent_instance_id` / socket / `after_instance_id`（DAG 边）** 表达；**依赖未成功**的子项应 **跳过或重试队列**，不得先于父锚点落位。 |
| **与 `placement_order` 对齐**          | 编排层字段见 §16.2，取值可与本节一致或由执行器将列表 **稳定排序** 后再逐条求解。                                                                           |


---

## 9. 领域预设（L4）

按项目模板可选启用（配置化，非硬编码全局规则）：

- **室内**：区域标签裁剪候选、大型家具优先靠长边墙等（仅在有 **§4 Zone Catalog / function_tags** 时生效）。
- **景观**：坡度上限、与路径距离（依赖**高度场或简模**）；花园 zone 应使用 `exterior_ground` 与 `max_slope_deg`。
- **舞台**：禁止区体积、结构净空（无数据则仅几何碰撞）。

---

## 10. 多层水平面歧义（产品必选行为）

当合并网格或复杂楼层导致 **同一垂线方向多个水平命中** 时：

1. 执行器应能检测 **多层水平命中**（至少在 `max_drop_distance` 内多于一层满足法线阈值）。
2. 输出 `**placement_confidence`**：`high | medium | low` 及 `**ambiguity`** 枚举，例如 `MULTIPLE_HORIZONTAL_HITS`。
3. **默认策略**（可配置）：
  - **保守**：不自动落位，仅**预览**（ghost）或写入待办；或
  - **取最低 / 最高**：仅当用户或 Placement Plan 显式指定 `horizontal_layer_policy: lowest | highest | nearest_to_reference_height`。
4. **意图区分**：`on_ground` 与 `on_surface` 必须在 Plan 层区分；`on_surface` 应绑定 **父实例** 或 **用户单次点击返回的 hit（instance + triangle）**。

### 10.5 批量歧义策略（`bulk_mode`）

单件默认仍以 **保守** 为主（见上）；**大批量**时若与用户体验冲突，允许在 **用户显式确认** 后放宽，与 §3 原则 3 **不冲突**（确认即构成意图）。


| 值              | 行为                                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `conservative` | 与单件一致：歧义则预览 / 待办 / 失败，不自动选层。                                                                                                           |
| `pragmatic`    | 仅对 Plan 中标记为 `**bulk_ambiguity_eligible: true`** 的条目，在用户对**本批次**点击确认后，允许使用 `horizontal_layer_policy: lowest`（或会话级默认层策略）；**未标记**的条目仍保守。 |


**要求**：`pragmatic` **必须** 有可审计的 `user_batch_ack_id` 或等价确认令牌 tied to `batch_id`（见 §16）。

---

## 11. 射线命中回传（补充 · 待引擎确认）

为支持调试、二次确认与 `on_surface` 精确定位，建议渲染器在射线检测 API 中返回如下信息（**实现优先级分两档**）。

### 11.1 MVP 最低集（建议必须）


| 字段           | 说明           |
| ------------ | ------------ |
| `hit_point`  | 世界坐标命中点      |
| `hit_normal` | 世界坐标法线（已归一化） |
| `distance`   | 射线起点到命中点距离   |


### 11.2 增强集（强烈建议）


| 字段                 | 说明                      |
| ------------------ | ----------------------- |
| `mesh_instance_id` | 场景内可稳定引用的实例 ID（与选择列表一致） |
| `triangle_index`   | 命中三角索引                  |
| `barycentric`      | 可选，用于插值或调试              |


若短期无法提供 `mesh_instance_id` / `triangle_index`，则 `**on_surface` 类摆放**应依赖 **父节点 socket** 或 **纯世界坐标 + 人工微调**，并在文档与 UI 中明示限制。

---

## 12. Placement Plan → 动作层（草案字段）

以下为云端生成、经 JSON Schema 校验后由本地执行器消费的**逻辑结构**（字段名可按现有 `aec-protocol` 对齐后改名）。**须通过 §4.6 Validator。**

```json
{
  "action": "place_assets",
  "idempotency_key": "uuid",
  "scene_up": "+Y",
  "spatial_context_revision": "zone_catalog_hash_or_version",
  "items": [
    {
      "asset_uid": "marketplace_or_renderer_id",
      "placement_semantic": "floor_placed",
      "target_zone_id": "zone_living_01",
      "placement_volume_id": "vol_living_floor",
      "assignment_source": "agent_structured",
      "transform": {
        "mode": "world_target",
        "translation": [x, y, z],
        "rotation_yaw_deg": 0
      },
      "snap": {
        "enabled": true,
        "along": "scene_up_negative",
        "max_distance_m": 50,
        "horizontal_normal_max_deg": 7
      },
      "collision_policy": "strict",
      "horizontal_layer_policy": "lowest",
      "parent_instance_id": null,
      "fallback": "preview_only_on_ambiguity"
    }
  ]
}
```

执行器回传建议包含：每实例**最终变换**、**命中信息摘要**、**错误码**、**缩略图或包围盒**（与总架构一致）。**大批量**时须满足 §16.3 的汇总结构。

---

## 13. 同步 / 导入侧建议（非渲染器核心也可分阶段）

在不强制用户拆分材质的前提下，推荐插件或同步管道**可选**写入：

- **逻辑锚点**：空节点 / 不可见碰撞盒，`role=floor_proxy | table_top_proxy` 等。
- **实例级元数据**：导出端的语义角色（不依赖当前材质是否正确）。
- **房间地面简模**：与视觉合并 mesh 分离的低面数碰撞体，专供 snap 与室内规则使用。
- **与 §4 的衔接**：同步时如能写入 **命名 placement_volume**（客厅地面、前院草坪范围），可显著降低 Zone Catalog 冷启动成本。

---

## 14. 分阶段交付建议


| 阶段     | 范围                                                                                                                           |
| ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **P0** | §4 最小闭环：单 zone + `placement_volume_id` + Validator；`floor_placed` + `snap_down` + `scene_up` + 硬碰撞；歧义时 `preview_only` 或失败明示。 |
| **P1** | 多 zone Catalog、SKU→zone 指派 UI / 会话默认；`wall_mounted` / `ceiling_hung`；`parent_instance_id` + 局部变换。                            |
| **P2** | 云端/执行器撒点策略、`scatter_policy`+`rng_seed`；软净空、关系 socket、`on_surface` 与命中 `triangle_index` 联动。                                   |
| **P3** | 领域预设与批量阵列优化；§17 地形贴合与 `zone_fill`；§16 分片与 `rollback_batch`（若渲染器支持）。                                                          |


---

## 15. 验收要点（节选）

- 在「整房 + 桌子合并为同一材质、不可分」的测试场景中：**不得**因缺少材质拆分而无法完成 `floor_placed`；至少应 **snap 到三角面** 或 **明确歧义并进入预览/人工一步**。
- 用户仅说「全部摆进场景」且 **未** 确认任何 zone 时：**不得**对大批量 SKU 下发无 `target_zone_id` / `placement_volume_id` / 等价 scope 的自动执行。
- 用户指令明确使用「路径 / 散布 / 笔刷」且数量超过配置阈值时：**应**走 §4.8 工具轨（或等价聚合动作），并带 `target_zone_id` 与 `path_id` / `path_polyline` 之一；**不得**仅靠未绑定 zone 的全局路径或笔划执行。
- 切换 `scene_up` 配置后，同一 Placement Plan 落位结果与预期一致。
- 所有自动落位均可映射到**幂等 key**，重复执行不产生重复实例（除非显式允许）。
- 大批量（超阈值）执行须带 **§16** 编排元数据或等价分片；失败策略符合 `on_partial_failure` 约定，且回传含 **汇总统计**。
- 室外 `exterior_ground` zone：坡度超 `max_slope_deg` 的 `floor_placed` 须 **失败或降级明示**，不得静默贴到非法坡面。

---

## 16. 大批量编排、分片与执行器回传

本章对应先前讨论的 **Placement Batch / Orchestration**、**Bulk ambiguity**、**执行器批量回传**，与 **§4 空间指派**、**§4.8 工具轨** **无冲突**：§4 解决「目标区域与路径/笔刷」；本章解决 **批次边界、顺序、失败与报表**。

### 16.1 编排元数据（建议出现在 Plan 根或 Envelope 扩展）


| 字段                            | 说明                                                   |
| ----------------------------- | ---------------------------------------------------- |
| `batch_id`                    | 单次用户确认对应的逻辑批次 UUID。                                  |
| `spatial_context_revision`    | 与 §12 一致，绑定 Zone Catalog 版本，避免分批间 zone 漂移。           |
| `chunk_index` / `chunk_total` | 可选；单请求超过 `**chunk_max_items`**（产品配置）时必须分片。           |
| `placement_order`             | `as_list`（显式数组顺序）                                    |
| `on_partial_failure`          | `continue`（记录失败，继续后续 item）                           |
| `bulk_mode`                   | 见 §10.5；与 `user_batch_ack_id` 成对出现（`pragmatic` 时必填）。 |
| `chunk_timeout_sec`           | 可选，防止单批阻塞 UI。                                        |


### 16.2 与 Validator（§4.6）的叠加

- 分片后 **每片**仍须通过 §4.6（每 item 有 `target_region_ref` 等）。  
- `placement_order: topology_dag` 时，Validator 须检测 **环** 与 **指向未放置父项的边**（或声明父项已在场景中存在）。

### 16.3 执行器回传 — 批量汇总（规定）

`place_assets` 载荷中可选编排字段（`batch_id`、`placement_order`、`on_partial_failure`、`bulk_mode`、`user_batch_ack_id`、分片等）的 Zod 定义见 `packages/aec-protocol` 的 `placeAssetsPayloadSchema`。

除单实例详情外，本批次或本分片须包含：


| 字段               | 说明                                                                             |
| ---------------- | ------------------------------------------------------------------------------ |
| `summary`        | `total` / `succeeded` / `failed` / `skipped_ambiguous` / `skipped_dependency`。 |
| `errors_by_code` | 如 `{ "TERRAIN_SLOPE_EXCEEDED": 12, "MULTIPLE_HORIZONTAL_HITS": 3 }`。           |
| `artifacts`      | 可选：`batch_thumbnail_uri`；或按 `target_zone_id` 分组的 **缩略图列表**（控制数量上限）。            |
| `item_results`   | 每项 `asset_uid`（或实例 id）、`status`、可选 `error_code`；超长时可 **截断 + 仅保留失败列表** 全量。      |


与 **单动作** `actionResultSchema`（`packages/aec-protocol`）衔接时，可将上述结构置于 `artifacts[].meta` 或扩展字段（后续版本化）。

---

## 17. 室外地形、贴合与 `zone_fill`（相对室内的差异）

本章落实 **花园与室内统一 Up、但不同 snap/填充策略**，避免仅依赖 §6.2 `**snap_down` + 水平法线** 导致 **室外大批量失败率偏高** 的问题。与 §4.2 `**max_slope_deg`**、§9 **景观** **无冲突**，为细化规定。

### 17.1 室内 vs 室外（按 `zone.kind`）


| 上下文                   | 支撑判定                                                       | 旋转                                                         |
| --------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| `**interior_floor`**  | `snap_down` + 法线与 `scene_up` 接近平行（水平地面）                    | 落地件通常 **仅 yaw**                                            |
| `**exterior_ground`** | 在 `max_slope_deg` 内：允许 **贴合命中三角**（`terrain_snap`）；超出：拒绝或降级 | 可选 **沿法线对齐 up**（资产元数据 `allows_terrain_tilt`）；否则仍仅 yaw + 贴地 |


### 17.2 坡度与失败码

- Zone 配置 `**max_slope_deg`**（缺省时用产品默认，如 25°）。  
- 命中法线与 `scene_up` 夹角 **大于** `max_slope_deg`：`floor_placed` 返回 `**TERRAIN_SLOPE_EXCEEDED`** 或进入待办，**禁止** 强行水平压平（除非用户显式 `force_flatten_proxy` 类实验开关）。

### 17.3 台阶、覆土厚度（可选）

- **台阶**：可配置 `**step_exclusion_volumes`** 或在 zone 内子标签；射线命中若落在台阶立面上应 `**SUPPORT_NOT_HORIZONTAL`** 或专用码。  
- **覆土 / 埋深**：SKU `embed_depth_m` 沿 **−scene_up** 在命中点后追加偏移；无元数据则 0。

### 17.4 `zone_fill` 与 `floor_placed`（室外）


| L0                 | 用途          | 算法要点（需求级）                                                                                             |
| ------------------ | ----------- | ----------------------------------------------------------------------------------------------------- |
| `**floor_placed`** | 离散盆栽、景石、灯具等 | 每实例 **逐点** `terrain_snap` 或 `snap_down` + 坡度校验                                                        |
| `**zone_fill`**    | 草坪模块、铺装格等   | **区域级**：在 `fill_region_id` / 多边形内 **栅格或泊松** 采样；每采样点取 **地形高度**（射线或高度场），再铺模块；**不**与「单点重复 300 次 place」混用 |


**规定**：大批量铺装/草坪优先 **§4.8 工具轨** 或 `**zone_fill` 专用动作** + `rng_seed`，避免 300 条独立 `floor_placed` 且未带地形策略。

### 17.5 与 `scene_up` 的统一性

**Up 轴仍全局一致**（§6.1）；差异仅在 **命中后是否允许倾斜贴合** 与 **坡度阈值**，**不**为花园单独定义第二套世界 Up（避免坐标分裂）。

---

## 18. 修订记录


| 日期         | 变更                                                                                     |
| ---------- | -------------------------------------------------------------------------------------- |
| 2026-04-01 | 初稿：合并摆放规则、无网格/无可靠材质约束、Up 轴与射线命中补充、歧义策略、协议草案                                            |
| 2026-04-01 | 新增 §4 空间意图与目标区域指派；设计原则第 6 条；§7/§12/§14/§15 与 Zone Catalog 衔接；验收补充                      |
| 2026-04-01 | 新增 §4.8：路径/散布/笔刷工具轨与 `populate_along_path` 等聚合动作、花园沿路径 100 植物工作流                       |
| 2026-04-01 | 新增 §8.1 拓扑顺序；§10.5 批量歧义 `bulk_mode`；§16 大批量编排/分片/回传；§17 室外地形与 `zone_fill`；原则第 7 条；验收补充 |
| 2026-04-01 | `placeAssetsPayloadSchema` 增加 §16 编排字段；§16.3 注明与 aec-protocol 对齐                       |


---

*本文档与仓库内《AEC 设计 AI 产品架构》计划中的 Asset Graph、Action Layer、素材平台深链一致；具体 JSON Schema 以 `packages/aec-protocol` 落地版本为准。*