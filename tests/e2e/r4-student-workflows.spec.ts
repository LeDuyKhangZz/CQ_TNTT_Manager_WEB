import { randomUUID, randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

const url=process.env.NEXT_PUBLIC_SUPABASE_URL!;
if(!/^http:\/\/(localhost|127\.0\.0\.1):/.test(url)) throw new Error("Local Supabase required");
const db=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
const tag=randomUUID().slice(0,8).replace(/\d/g,d=>String.fromCharCode(103+Number(d)));
const guardianNames:string[]=[], studentNames:string[]=[];
async function login(page:Page, username="GLV901") {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill(username);
  await page.locator("#password").fill("123456");
  await page.getByRole("button",{name:"Đăng nhập",exact:true}).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
async function settled(page:Page) {
  await expect.poll(()=>page.getByRole("dialog").evaluate(el=>el.getAnimations().length)).toBe(0);
}
test.afterAll(async()=>{
  // Only these unassigned synthetic profiles; no enrollment/attendance history.
  if(studentNames.length) expect((await db.from("students").delete().in("full_name",studentNames)).error).toBeNull();
  if(guardianNames.length) expect((await db.from("guardians").delete().in("full_name",guardianNames)).error).toBeNull();
});
for(const noJs of [false,true]) test(`guardian → child saves once and links the saved profile (noJS=${noJs})`,async({page,browser})=>{
  await login(page);
  const context=noJs ? await browser.newContext({javaScriptEnabled:false,storageState:await page.context().storageState(),viewport:page.viewportSize()!}) : null;
  const active=context ? await context.newPage() : page;
  const guardianName=`Giám hộ Rtest ${tag} ${noJs ? "hai" : "một"}`;
  const studentName=`Thiếu nhi Rtest ${tag} ${noJs ? "hai" : "một"}`;
  guardianNames.push(guardianName); studentNames.push(studentName);
  const phone=`09${randomInt(10000000,99999999)}`;
  try {
    await active.goto("/students?new=1&q=khongkhop");
    await settled(active);
    await active.getByRole("link",{name:"Thêm người giám hộ",exact:true}).click();
    await settled(active);
    const guardianForm=active.getByRole("form",{name:"Thêm người giám hộ",exact:true});
    await guardianForm.getByLabel("Họ tên phụ huynh").fill(guardianName);
    await guardianForm.getByLabel("Điện thoại",{exact:true}).fill(phone);
    await guardianForm.getByRole("button",{name:"Tạo phụ huynh",exact:true}).click();
    await expect(active).toHaveURL(/step=student/);
    await settled(active);
    await expect(active.getByRole("navigation",{name:"Các bước Thêm thiếu nhi"}).locator('[aria-current="step"]')).toContainText("2.");
    expect(active.url()).not.toContain(phone);
    expect(active.url()).not.toContain(encodeURIComponent(guardianName));
    const form=active.getByRole("form",{name:"Thêm thiếu nhi",exact:true});
    await expect(form.getByLabel("Người giám hộ",{exact:true})).toHaveValue(new URL(active.url()).searchParams.get("guardian")!);
    await form.getByLabel("Tên thánh",{exact:true}).fill("Giuse");
    await form.getByLabel("Họ tên",{exact:true}).fill(studentName);
    await form.getByLabel("Ngày sinh",{exact:true}).fill("2017-02-14");
    await form.getByRole("button",{name:"Tạo hồ sơ thiếu nhi",exact:true}).click();
    await expect(active.getByText(/Đã tạo hồ sơ .* mã thiếu nhi CQ\d+/)).toBeVisible();
    const saved=await db.from("students").select("id,guardian_id").eq("full_name",studentName);
    expect(saved.error).toBeNull(); expect(saved.data).toHaveLength(1);
    expect(saved.data![0].guardian_id).toBe(new URL(active.url()).searchParams.get("guardian"));
    await settled(active);
    await active.getByRole("link",{name:"Mở hồ sơ thiếu nhi",exact:true}).click();
    await expect(active.getByRole("heading",{level:1,name:`Giuse ${studentName}`})).toBeVisible();
    await expect(active.getByRole("form",{name:/Cập nhật hồ sơ/})).toHaveCount(0);
  } finally {if(context) await context.close();}
});

test("detail has six native tabs; family and attendance load under staff permissions",async({page},info)=>{
  await login(page);
  const result=await db.from("students").select("id").eq("full_name","Nguyễn Minh An").single();
  expect(result.error).toBeNull();
  const root=`/students/${result.data!.id}`;
  await page.goto(root);
  const tabs=page.getByRole("navigation",{name:"Thông tin thiếu nhi"});
  await expect(tabs.getByRole("link")).toHaveCount(6);
  await expect(page.getByRole("heading",{name:"Thông tin cá nhân",exact:true})).toBeVisible();
  await expect(page.getByRole("form",{name:/Cập nhật hồ sơ/})).toHaveCount(0);
  await tabs.getByRole("link",{name:"Gia đình",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Anh chị em cùng người giám hộ",exact:true})).toBeVisible();
  await expect(page.locator('a[href="tel:0912000001"]').first()).toBeVisible();
  await tabs.getByRole("link",{name:"Chuyên cần",exact:true}).click();
  await expect.poll(()=>tabs.evaluate(nav=>{
    const current=nav.querySelector('[aria-current="page"]')!.getBoundingClientRect();
    const frame=nav.getBoundingClientRect();
    return current.left>=frame.left-1 && current.right<=frame.right+1;
  })).toBe(true);
  await expect(page.getByText(/Không thể tải chuyên cần/)).toHaveCount(0);
  await expect(page.getByText(/Chưa có buổi điểm danh nào được chốt/).or(page.getByRole("heading",{name:"Chuyên cần",exact:true}))).toBeVisible();
  await expect(page.getByText(/Không thể tải ghi chú/)).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({path:info.outputPath("student-attendance.png")});
  await page.goto(`${root}?tab=unknown&panel=invalid`);
  await expect(page.getByRole("heading",{name:"Thông tin cá nhân",exact:true})).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("filter sheet remains visible after resize and cancel preserves the current page",async({page},info)=>{
  await login(page);
  await page.setViewportSize({width:360,height:800});
  await page.goto("/students?page=2&size=20");
  await page.getByRole("link",{name:/^Lọc(?: \(|$)/}).click();
  const dialog=page.getByRole("dialog",{name:"Lọc danh sách thiếu nhi",exact:true});
  await expect(dialog).toBeVisible();
  await page.screenshot({path:info.outputPath("student-filter-sheet.png")});
  expect(new URL(page.url()).searchParams.get("page")).toBe("2");
  await page.setViewportSize({width:1366,height:768});
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(new URL(page.url()).searchParams.get("page")).toBe("2");
  expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe("hidden");
  await page.goto("/students?page=2&filters=1");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("link",{name:"Đóng",exact:true}).click();
  expect(new URL(page.url()).searchParams.get("page")).toBe("2");
});

test("treasurer mobile uses scalar filters and cannot open a student drawer",async({page})=>{
  await login(page,"GLV904");
  await page.setViewportSize({width:360,height:800});
  await page.goto("/students?q=nguyen+minh+an&new=guardian");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText(/Chế độ chỉ xem theo quyền Thủ quỹ/)).toBeVisible();
  await page.getByRole("link",{name:/^Lọc(?: \(|$)/}).click();
  const dialog=page.getByRole("dialog",{name:"Lọc danh sách thiếu nhi",exact:true});
  await expect(dialog.getByRole("checkbox")).toHaveCount(0);
  await dialog.getByRole("combobox",{name:"Trạng thái",exact:true}).selectOption("active");
  await dialog.getByRole("button",{name:"Áp dụng bộ lọc",exact:true}).click();
  await expect(page.getByRole("table").locator('a[href^="/students/"]')).toHaveCount(0);
  await expect(page.getByRole("table")).toContainText("Nguyễn Minh An");
});
