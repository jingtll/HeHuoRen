import source from "../../../../docs/research/sicau-colleges-2026-10-02/colleges.json";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import CollegePicker from "./CollegePicker.vue";
import { colleges } from "../data/colleges";
import type { CollegeSelection } from "../data/college-selection";

describe("首页学院入口", () => {
  let wrapper: ReturnType<typeof mount<typeof CollegePicker>>;
  afterEach(() => wrapper?.unmount());

  function visit(initial: CollegeSelection = []) {
    wrapper = mount(CollegePicker, {
      props: {
        modelValue: initial,
        "onUpdate:modelValue": (id) => wrapper.setProps({ modelValue: id }),
      },
    });
    return wrapper;
  }

  it("27个学院顺序、名称与研究记录一致，ID唯一且25个院徽对应各自ID", () => {
    expect(colleges).toHaveLength(27);
    expect(new Set(colleges.map((college) => college.id)).size).toBe(27);
    expect(colleges.map((college) => college.name)).toEqual(
      source.records.map((college) => college.name),
    );
    colleges.forEach((college, index) => {
      expect(Boolean(college.emblem)).toBe(
        source.records[index]!.independentLogoFound,
      );
      if (college.emblem) expect(college.emblem).toContain(`${college.id}.`);
    });
    visit();
    expect(wrapper.findAll("[data-college-id]")).toHaveLength(27);
    expect(wrapper.findAll("img")).toHaveLength(25);
    for (const college of colleges) {
      expect(
        wrapper
          .get(`[data-college-id="${college.id}"]`)
          .attributes("aria-label"),
      ).toBe(college.name);
    }
  });

  it("默认未选择任何学院，全部学院按钮不高亮不打勾", () => {
    visit();
    expect(wrapper.findAll('[aria-pressed="true"]')).toHaveLength(0);
    expect(wrapper.get('[role="status"]').text()).toContain("未选择学院");
    expect(wrapper.get(".college-reset").text()).toBe("全部学院");
    expect(wrapper.get(".college-reset").classes()).toContain(
      "hhr-button--secondary",
    );
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("可同时选择多个学院，各自取消，最后一项取消回到未选择", async () => {
    visit();
    await wrapper.get('[data-college-id="agriculture"]').trigger("click");
    await wrapper.get('[data-college-id="law"]').trigger("click");
    expect(wrapper.findAll('.college-entry[aria-pressed="true"]')).toHaveLength(
      2,
    );
    expect(wrapper.get('[role="status"]').text()).toContain("已选择 2 个学院");
    expect(wrapper.get('[data-college-id="law"] .college-check').text()).toBe(
      "✓",
    );
    expect(wrapper.emitted("select")).toEqual([
      [["agriculture"]],
      [["agriculture", "law"]],
    ]);
    expect(wrapper.get(".college-reset").attributes("aria-pressed")).toBe(
      "false",
    );
    await wrapper.get('[data-college-id="law"]').trigger("click");
    expect(
      wrapper.get('[data-college-id="agriculture"]').attributes("aria-pressed"),
    ).toBe("true");
    expect(
      wrapper.get('[data-college-id="law"]').attributes("aria-pressed"),
    ).toBe("false");
    expect(wrapper.get('[role="status"]').text()).toContain("农学院");
    await wrapper.get('[data-college-id="agriculture"]').trigger("click");
    expect(wrapper.findAll('.college-entry[aria-pressed="true"]')).toHaveLength(
      0,
    );
    expect(wrapper.get('[role="status"]').text()).toContain("未选择学院");
    expect(
      wrapper.find('[data-college-id="law"] .college-check').exists(),
    ).toBe(false);
    expect(wrapper.emitted("select")).toEqual([
      [["agriculture"]],
      [["agriculture", "law"]],
      [["agriculture"]],
    ]);
    expect(wrapper.emitted("clear")).toEqual([[]]);
    expect(wrapper.emitted("reset")).toBeUndefined();
    expect(wrapper.emitted("update:modelValue")).toEqual([
      [["agriculture"]],
      [["agriculture", "law"]],
      [["agriculture"]],
      [[]],
    ]);
    expect(wrapper.get(".college-reset").attributes("aria-pressed")).toBe(
      "false",
    );
  });

  it("点击全部学院清除自选学院并明确选中全部，再点击院徽进入自选", async () => {
    visit(["law", "agriculture"]);
    await wrapper.get(".college-reset").trigger("click");
    expect(wrapper.findAll('.college-entry[aria-pressed="true"]')).toHaveLength(
      0,
    );
    expect(wrapper.get('[role="status"]').text()).toContain("全部学院");
    expect(wrapper.emitted("update:modelValue")).toEqual([["all"]]);
    expect(wrapper.emitted("reset")).toEqual([[]]);
    expect(wrapper.get(".college-reset").attributes("aria-pressed")).toBe(
      "true",
    );
    expect(wrapper.get(".college-reset").text()).toBe("✓全部学院");
    expect(wrapper.get(".college-reset").classes()).toContain(
      "hhr-button--soft",
    );
    await wrapper.get('[data-college-id="law"]').trigger("click");
    expect(wrapper.get(".college-reset").attributes("aria-pressed")).toBe(
      "false",
    );
    expect(wrapper.get(".college-reset").text()).toBe("全部学院");
    expect(wrapper.get(".college-reset").classes()).toContain(
      "hhr-button--secondary",
    );
    expect(wrapper.emitted("select")).toEqual([[["law"]]]);
  });

  it("再次点击全部学院回到未选择，熄灭按钮并移除勾选", async () => {
    visit();
    await wrapper.get(".college-reset").trigger("click");
    expect(wrapper.get(".college-reset").attributes("aria-pressed")).toBe(
      "true",
    );
    expect(wrapper.get(".college-reset").text()).toContain("✓");
    await wrapper.get(".college-reset").trigger("click");
    expect(wrapper.get(".college-reset").attributes("aria-pressed")).toBe(
      "false",
    );
    expect(wrapper.get(".college-reset").text()).toBe("全部学院");
    expect(wrapper.get(".college-reset").classes()).toContain(
      "hhr-button--secondary",
    );
    expect(wrapper.get('[role="status"]').text()).toContain("未选择学院");
    expect(wrapper.findAll('.college-entry[aria-pressed="true"]')).toHaveLength(
      0,
    );
    expect(wrapper.emitted("update:modelValue")).toEqual([["all"], [[]]]);
    expect(wrapper.emitted("reset")).toEqual([[]]);
    expect(wrapper.emitted("clear")).toEqual([[]]);
  });

  it("父页面恢复多个学院ID、全部或未选择时更新反馈", async () => {
    visit();
    await wrapper.setProps({ modelValue: ["architecture-planning", "law"] });
    expect(
      wrapper
        .get('[data-college-id="architecture-planning"]')
        .attributes("aria-pressed"),
    ).toBe("true");
    expect(wrapper.findAll('.college-entry[aria-pressed="true"]')).toHaveLength(
      2,
    );
    expect(wrapper.get('[role="status"]').text()).toContain("已选择 2 个学院");
    await wrapper.setProps({ modelValue: "all" });
    expect(wrapper.findAll('.college-entry[aria-pressed="true"]')).toHaveLength(
      0,
    );
    expect(wrapper.get(".college-reset").attributes("aria-pressed")).toBe(
      "true",
    );
    await wrapper.setProps({ modelValue: [] });
    expect(wrapper.get(".college-reset").attributes("aria-pressed")).toBe(
      "false",
    );
    expect(wrapper.get('[role="status"]').text()).toContain("未选择学院");
  });

  it("逐个选满27个学院也不会自动点亮全部学院按钮", async () => {
    visit();
    for (const college of colleges) {
      await wrapper.get(`[data-college-id="${college.id}"]`).trigger("click");
    }
    expect(wrapper.findAll('.college-entry[aria-pressed="true"]')).toHaveLength(
      27,
    );
    expect(wrapper.get('[role="status"]').text()).toContain("已选择 27 个学院");
    expect(wrapper.get(".college-reset").attributes("aria-pressed")).toBe(
      "false",
    );
    expect(wrapper.get(".college-reset").text()).toBe("全部学院");
  });

  it("选择事件参数被监听器修改时不影响受控模型", async () => {
    wrapper = mount(CollegePicker, {
      props: {
        modelValue: [],
        "onUpdate:modelValue": (selection) =>
          wrapper.setProps({ modelValue: selection }),
        onSelect: (ids) => ids.push("law"),
      },
    });
    await wrapper.get('[data-college-id="agriculture"]').trigger("click");
    expect(wrapper.findAll('.college-entry[aria-pressed="true"]')).toHaveLength(
      1,
    );
    expect(
      wrapper.get('[data-college-id="law"]').attributes("aria-pressed"),
    ).toBe("false");
    expect(wrapper.get('[role="status"]').text()).toContain("农学院");
    expect(wrapper.emitted("update:modelValue")).toEqual([[["agriculture"]]]);
  });

  it("缺失院徽与加载失败回退到首字，失败不会影响其他图片及学院选择", async () => {
    visit();
    expect(
      wrapper
        .get('[data-college-id="agricultural-engineering"] .college-initial')
        .text(),
    ).toBe("农");
    expect(
      wrapper
        .get('[data-college-id="civil-engineering"] .college-initial')
        .text(),
    ).toBe("土");
    await wrapper.get('[data-college-id="agriculture"] img').trigger("error");
    expect(wrapper.find('[data-college-id="agriculture"] img').exists()).toBe(
      false,
    );
    expect(
      wrapper.get('[data-college-id="agriculture"] .college-initial').text(),
    ).toBe("农");
    expect(wrapper.findAll("img")).toHaveLength(24);
    await wrapper.get('[data-college-id="agriculture"]').trigger("click");
    expect(wrapper.get('[role="status"]').text()).toContain("农学院");
  });

  it("白色透明院徽使用深色底衬，加载失败后恢复首字的浅色底衬", async () => {
    visit();
    expect(
      colleges
        .filter((college) => college.whiteArtwork)
        .map((college) => college.id),
    ).toEqual([
      "horticulture",
      "food-science",
      "mechanical-electrical",
      "architecture-planning",
    ]);
    for (const id of [
      "horticulture",
      "food-science",
      "mechanical-electrical",
      "architecture-planning",
    ]) {
      expect(
        wrapper.get(`[data-college-id="${id}"] .college-emblem`).classes(),
      ).toContain("college-emblem--white-artwork");
    }
    await wrapper.get('[data-college-id="horticulture"] img').trigger("error");
    expect(
      wrapper.get('[data-college-id="horticulture"] .college-emblem').classes(),
    ).not.toContain("college-emblem--white-artwork");
    expect(
      wrapper.get('[data-college-id="horticulture"] .college-initial').text(),
    ).toBe("园");
  });

  it("前三行图片正常加载，其余懒加载，滚动区可由键盘聚焦", () => {
    visit();
    expect(wrapper.findAll('img[loading="eager"]')).toHaveLength(12);
    expect(wrapper.findAll('img[loading="lazy"]')).toHaveLength(13);
    expect(wrapper.get(".college-scroll").attributes("tabindex")).toBe("0");
    expect(wrapper.get(".college-scroll").attributes("aria-describedby")).toBe(
      "college-scroll-hint",
    );
  });
});
