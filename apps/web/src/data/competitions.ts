import type { CollegeId } from "./colleges";

// 人工核对的前端样例，非 /api/v1 正式契约。固定时间避免刷新改变演示状态。
export const DEMO_NOW = "2026-10-04T12:00:00+08:00";
export type Scope = {
  kind: "all" | "colleges" | "complex" | "unknown";
  colleges: CollegeId[];
  note: string;
};
export type Notice = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  publishedAt: string;
  checkedAt: string;
  kind: "registration" | "supplement" | "award" | "news";
};
export type Stage = {
  id: string;
  name: string;
  organizer: string;
  hosts: CollegeId[];
  scope: Scope;
  startsAt?: string;
  deadline?: string;
  materialsAt?: string;
  eventAt?: string;
  timeNote?: string;
  conflict?: boolean;
  registration: string;
  sourceIds: string[];
};
export type Track = {
  id: string;
  name: string;
  mode: "individual" | "team" | "mixed";
  members: string;
  rules: string;
};
export type Competition = {
  id: string;
  name: string;
  edition: string;
  category: "编程" | "学科技能" | "科技创新" | "数据建模";
  organizer: string;
  origin: "official" | "historical" | "demo";
  tracks: Track[];
  stages: Stage[];
  notices: Notice[];
};

const allUndergraduates: Scope = {
  kind: "all",
  colleges: [],
  note: "全日制在校本科生；仍需核对校区与组队等限制。",
};
function notice(
  id: string,
  title: string,
  publisher: string,
  url: string,
  publishedAt: string,
): Notice {
  return {
    id,
    title,
    publisher,
    url,
    publishedAt,
    checkedAt: "2026-10-04",
    kind: "registration",
  };
}
export const competitions: Competition[] = [
  {
    id: "programming-2026-8",
    name: "大学生程序设计竞赛",
    edition: "2026 · 第八届",
    category: "编程",
    organizer: "四川农业大学教务处",
    origin: "official",
    tracks: [
      {
        id: "programming-2026-freshman",
        name: "新生组",
        mode: "individual",
        members: "1 人，独立参赛",
        rules: "2026 级本科生；个人上机，使用 C、C++、Java 或 Python 3。",
      },
      {
        id: "programming-2026-senior",
        name: "高年级组",
        mode: "individual",
        members: "1 人，独立参赛",
        rules: "其他年级本科生；比赛地点拟在雅安，其他校区需自行安排赴赛。",
      },
    ],
    stages: [
      {
        id: "programming-2026-campus",
        name: "校赛",
        organizer: "信息工程学院",
        hosts: ["information-engineering"],
        scope: {
          ...allUndergraduates,
          note: "全校本科生，年级、专业不限；个人赛，不组队。比赛地点拟在雅安校区。",
        },
        deadline: "2026-10-14T00:00:00+08:00",
        timeNote:
          "原文截止为 10 月 13 日 24:00；比赛时间、地点以群内后续通知为准。",
        registration:
          "加入赛事 QQ 群 1121048472，填写群公告中的报名问卷。个人独立报名，不需要组队。",
        sourceIds: ["programming-notice"],
      },
    ],
    notices: [
      notice(
        "programming-notice",
        "关于举办四川农业大学第八届大学生程序设计竞赛的通知",
        "信息工程学院",
        "https://xxgc.sicau.edu.cn/info/1043/18074.htm",
        "2026-09-17",
      ),
    ],
  },
  {
    id: "biology-2026-15",
    name: "生物学知识与实验技能竞赛",
    edition: "2026 · 第十五届",
    category: "学科技能",
    organizer: "四川农业大学教务处",
    origin: "official",
    tracks: [
      {
        id: "biology-2026-team",
        name: "知识与实验技能",
        mode: "team",
        members: "4 人，不得跨校区",
        rules:
          "全校本科生；初赛笔试，复赛实验操作，决赛答辩。报名超过 5000 人时系统会提前关闭。",
      },
    ],
    stages: [
      {
        id: "biology-2026-preliminary",
        name: "初赛",
        organizer: "生命科学学院",
        hosts: ["life-science"],
        scope: allUndergraduates,
        startsAt: "2026-10-08T10:00:00+08:00",
        deadline: "2026-10-13T18:00:00+08:00",
        eventAt: "2026-10-16T16:30:00+08:00",
        registration:
          "以 4 人小组登录教务管理系统，在“学生 → 考试信息 → 生物学知识大赛”报名；不得跨校区。核对信息，错误信息视为无效。",
        sourceIds: ["biology-notice"],
      },
      {
        id: "biology-2026-semifinal",
        name: "复赛 / 决赛",
        organizer: "生命科学学院",
        hosts: ["life-science"],
        scope: {
          kind: "complex",
          colleges: [],
          note: "仅限初赛晋级小组，并按复赛成绩确定决赛资格；查看官方通知。",
        },
        eventAt: "2026-10-25T00:00:00+08:00",
        timeNote:
          "复赛 10 月 25 日，决赛 10 月 31 日；具体时刻待公布。无单独开放报名。",
        registration: "由前一赛段选拔晋级，不接受独立报名。",
        sourceIds: ["biology-notice"],
      },
    ],
    notices: [
      notice(
        "biology-notice",
        "关于举办四川农业大学第十五届生物学知识与实验技能竞赛的通知",
        "生命科学学院",
        "https://smkx.sicau.edu.cn/info/1061/28771.htm",
        "2026-09-20",
      ),
    ],
  },
  {
    id: "challenge-2027-20",
    name: "“挑战杯”课外学术科技作品竞赛",
    edition: "2027 · 第二十届",
    category: "科技创新",
    organizer: "四川农业大学校团委",
    origin: "official",
    tracks: [
      {
        id: "challenge-20-paper",
        name: "自然科学学术论文",
        mode: "mixed",
        members: "个人作品或 3–10 人集体作品",
        rules:
          "作者限本科生；个人作品须承担 60% 以上研究，最多 2 名合作者；无法区分第一作者时按集体作品申报。",
      },
      {
        id: "challenge-20-social",
        name: "社会调查报告",
        mode: "mixed",
        members: "个人作品或 3–10 人集体作品",
        rules: "按通知选择调查主题，并核对学历及指导教师要求。",
      },
      {
        id: "challenge-20-invention",
        name: "科技发明制作",
        mode: "mixed",
        members: "个人作品或 3–10 人集体作品",
        rules: "分 A、B 类，核对作品成果、原创性及推荐要求。",
      },
    ],
    stages: [
      {
        id: "challenge-20-civil",
        name: "土木工程学院院赛",
        organizer: "土木工程学院",
        hosts: ["civil-engineering"],
        scope: {
          kind: "colleges",
          colleges: ["civil-engineering"],
          note: "院内选拔；学历、注册日期、成果及指导教师资格另有规则，请核对官方通知。",
        },
        materialsAt: "2026-10-05T00:00:00+08:00",
        eventAt: "2026-10-08T00:00:00+08:00",
        timeNote:
          "材料截止为 10 月 4 日 24:00；院赛具体时刻待公布，报名时间未单独说明。",
        registration:
          "按原文打包申报书、项目介绍及支撑材料，发送至学院指定邮箱 2080519973@qq.com。",
        sourceIds: ["challenge-civil", "challenge-campus"],
      },
      {
        id: "challenge-20-resources",
        name: "资源学院院赛",
        organizer: "资源学院",
        hosts: ["resources"],
        scope: {
          kind: "colleges",
          colleges: ["resources"],
          note: "院内选拔；注册日期、学历、作品完成周期及教师推荐条件需核对原文。",
        },
        deadline: "2026-10-10T22:00:00+08:00",
        materialsAt: "2026-10-10T22:00:00+08:00",
        timeNote: "10 月 11–16 日院内初筛，具体答辩时间待公布。",
        registration:
          "将申报书、20 页以内项目介绍及支撑材料打包，按通知命名，发送至 19141397132@163.com；赛事答疑 QQ 群 1037566330。",
        sourceIds: ["challenge-resources", "challenge-campus"],
      },
      {
        id: "challenge-20-campus",
        name: "校内预选 / 重点项目遴选",
        organizer: "校团委",
        hosts: [],
        scope: {
          kind: "complex",
          colleges: [],
          note: "经学院推荐及校内遴选，资格和时间需查阅校团委原文及附件；不可据转载学院推断承办关系。",
        },
        registration:
          "先按所属学院通知完成院内申报，再查阅校团委原文及附件。当前网页正文未能完整直读，具体时间与规则待人工复核。",
        sourceIds: ["challenge-campus"],
      },
    ],
    notices: [
      notice(
        "challenge-campus",
        "第二十届“挑战杯”校内预选及重点项目遴选通知",
        "校团委",
        "https://tw.sicau.edu.cn/info/1099/17606.htm",
        "2026-09-15",
      ),
      notice(
        "challenge-civil",
        "第二十届“挑战杯”土木工程学院院赛通知",
        "土木工程学院",
        "https://tmgcxy.sicau.edu.cn/info/1046/10774.htm",
        "2026-09-17",
      ),
      notice(
        "challenge-resources",
        "第二十届“挑战杯”资源学院院赛遴选通知",
        "资源学院",
        "https://zyxy.sicau.edu.cn/info/1192/18438.htm",
        "2026-09-28",
      ),
    ],
  },
  {
    id: "statistics-2026-12",
    name: "全国大学生统计建模大赛校内选拔",
    edition: "2026 · 第十二届",
    category: "数据建模",
    organizer: "中国统计教育学会；校内组织：经济学院",
    origin: "historical",
    tracks: [
      {
        id: "statistics-12-model",
        name: "统计建模",
        mode: "team",
        members: "3 人，同一学历组别",
        rules:
          "全校全日制本科生、研究生；三名成员均为本科生或均为研究生，每队限 1 名指导教师。",
      },
    ],
    stages: [
      {
        id: "statistics-12-campus",
        name: "校内选拔",
        organizer: "经济学院",
        hosts: ["economics"],
        scope: {
          kind: "all",
          colleges: [],
          note: "全日制本科生、研究生；禁止跨学历组别组队。",
        },
        materialsAt: "2026-05-08T23:59:00+08:00",
        registration:
          "按通知通过外部提交网址 https://send2me.cn/pH6BxC-q/Q4SrhpofCPmNng 上传论文 PDF、查重报告及支撑数据代码；官方 QQ 群 308310715。该轮材料提交已截止。",
        sourceIds: ["statistics-notice"],
      },
    ],
    notices: [
      notice(
        "statistics-notice",
        "2026 年第十二届统计建模大赛校内选拔通知",
        "经济学院",
        "https://jjxy.sicau.edu.cn/info/1007/20662.htm",
        "2026-04-02",
      ),
    ],
  },
  ...([2026, 2025] as const).map((year): Competition => ({
    id: `demo-campus-ideas-${year}`,
    name: "校园创意实验（虚构样例）",
    edition: `${year} · 演示届次`,
    category: "科技创新",
    organizer: "演示组织单位（虚构）",
    origin: "demo",
    tracks: [
      {
        id: `demo-ideas-${year}-team`,
        name: "创意实践",
        mode: "team",
        members: "2–4 人（演示）",
        rules: "虚构交互样例，无真实赛事、联系方式或报名入口。",
      },
    ],
    stages: [
      {
        id: `demo-ideas-${year}-stage`,
        name: "创意展示（演示）",
        organizer: "演示组织单位",
        hosts: ["arts-media", "information-engineering"],
        scope:
          year === 2026
            ? {
                kind: "unknown",
                colleges: [],
                note: "参赛范围尚未公布（虚构），不能认定学院匹配或资格通过。",
              }
            : {
                kind: "all",
                colleges: [],
                note: "全校开放（虚构），仅供筛选交互演示。",
              },
        startsAt: `${year}-10-01T00:00:00+08:00`,
        deadline: `${year}-10-20T18:00:00+08:00`,
        conflict: year === 2026,
        timeNote:
          year === 2026
            ? "虚构通知时间冲突，待核对；不能判断为开放报名。"
            : undefined,
        registration: "虚构样例，无官方报名入口。",
        sourceIds: [],
      },
    ],
    notices: [],
  })),
];
export const originLabels = {
  official: "官方通知样例",
  historical: "官方历史信息",
  demo: "虚构交互样例",
};
