import { expect, type Page } from "@playwright/test";

export async function openStudentFilter(page: Page, facet: "class" | "sector" | "status") {
  if (page.viewportSize()!.width < 768) {
    await page.getByRole("link", { name: /^Lọc(?: \(|$)/ }).click();
    await expect.poll(() => page.getByRole("dialog").evaluate(element => element.getAnimations().length)).toBe(0);
    return page.getByRole("form", {name:"Lọc danh sách thiếu nhi",exact:true});
  }
  const filters=page.getByRole("group", {name:"Lọc danh sách thiếu nhi"});
  await filters.locator('[data-facet="'+facet+'"] summary').click();
  return filters;
}
export async function applyStudentFilter(page: Page, facet: "class" | "sector" | "status") {
  if(page.viewportSize()!.width<768) await page.getByRole("button",{name:"Áp dụng bộ lọc",exact:true}).click();
  else await page.locator('[data-facet="'+facet+'"]').getByRole("button",{name:"Áp dụng",exact:true}).click();
}
export async function beginStudentCreation(page:Page, guardian?:string) {
  await page.getByRole("link",{name:"Thêm thiếu nhi",exact:true}).click();
  await expect.poll(() => page.getByRole("dialog").evaluate(element => element.getAnimations().length)).toBe(0);
  await page.getByLabel("Người giám hộ đã có",{exact:true}).selectOption(guardian ? {label:guardian} : {index:1});
  await page.getByRole("button",{name:"Tiếp tục",exact:true}).click();
}
export async function openStudentPanel(page:Page, panel:"profile"|"status"|"guardian"|"health") {
  if(panel==="profile") await page.getByRole("link",{name:"Sửa hồ sơ",exact:true}).click();
  if(panel==="health") await page.getByRole("link",{name:"Sửa sức khỏe",exact:true}).click();
  if(panel==="status") {
    await page.locator("summary").filter({hasText:"Thao tác khác"}).click();
    await page.getByRole("menuitem",{name:"Đổi trạng thái hồ sơ",exact:true}).click();
  }
  if(panel==="guardian") {
    await page.getByRole("navigation",{name:"Thông tin thiếu nhi"}).getByRole("link",{name:"Gia đình",exact:true}).click();
    await page.getByRole("link",{name:"Sửa / đổi người giám hộ",exact:true}).click();
  }
}
