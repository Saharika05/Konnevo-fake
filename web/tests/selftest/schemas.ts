import {
  basicSchema,
  linksSchema,
  customSkillSchema,
  projectSchema,
  experienceSchema,
} from "@/lib/schemas/profile";
import { createPasswordSchema, changePasswordSchema, loginSchema, feedbackSchema } from "@/lib/schemas/auth";
import { teamSchema } from "@/lib/schemas/team";
import { validateImage } from "@/lib/schemas/files";
let f = 0;
const t = (n: string, c: boolean) => {
  if (!c) {
    f++;
    console.log("FAIL", n);
  } else console.log("ok  ", n);
};
const ok = (s: any, v: any) => s.safeParse(v).success;
const basic = { name: "Priya", college: "Anna University", year: "3rd", lookingFor: ["teammate"], bio: "" };
t("basic ok", ok(basicSchema, basic));
t("name 1 char fails", !ok(basicSchema, { ...basic, name: "P" }));
t(
  "name 60 ok / 61 fails",
  ok(basicSchema, { ...basic, name: "a".repeat(60) }) && !ok(basicSchema, { ...basic, name: "a".repeat(61) }),
);
t(
  "bio 300 ok / 301 fails",
  ok(basicSchema, { ...basic, bio: "a".repeat(300) }) && !ok(basicSchema, { ...basic, bio: "a".repeat(301) }),
);
t("lookingFor needs one", !ok(basicSchema, { ...basic, lookingFor: [] }));
t("portfolio ok", ok(linksSchema, { github: "", linkedin: "", portfolio: "https://me.dev", discord: "", whatsapp: "", about: "" }));
t("portfolio bad", !ok(linksSchema, { github: "", linkedin: "", portfolio: "nope", discord: "", whatsapp: "", about: "" }));
t("discord ok", ok(linksSchema, { github: "", linkedin: "", portfolio: "", discord: "priya_dev", whatsapp: "", about: "" }));
t("discord with spaces fails", !ok(linksSchema, { github: "", linkedin: "", portfolio: "", discord: "a b c", whatsapp: "", about: "" }));
t("whatsapp ok", ok(linksSchema, { github: "", linkedin: "", portfolio: "", discord: "", whatsapp: "+91 98765 43210", about: "" }));
t("whatsapp letters fail", !ok(linksSchema, { github: "", linkedin: "", portfolio: "", discord: "", whatsapp: "call me", about: "" }));
t("links empty ok", ok(linksSchema, { github: "", linkedin: "", portfolio: "", discord: "", whatsapp: "", about: "" }));
t("github url ok", ok(linksSchema, { github: "https://github.com/me", linkedin: "", portfolio: "", discord: "", whatsapp: "", about: "" }));
t("github wrong host fails", !ok(linksSchema, { github: "https://evil.com/me", linkedin: "", portfolio: "", discord: "", whatsapp: "", about: "" }));
t(
  "about 1000/1001",
  ok(linksSchema, { github: "", linkedin: "", portfolio: "", discord: "", whatsapp: "", about: "a".repeat(1000) }) &&
    !ok(linksSchema, { github: "", linkedin: "", portfolio: "", discord: "", whatsapp: "", about: "a".repeat(1001) }),
);
t(
  "custom skill 2..40",
  !ok(customSkillSchema, "a") &&
    ok(customSkillSchema, "ab") &&
    ok(customSkillSchema, "a".repeat(40)) &&
    !ok(customSkillSchema, "a".repeat(41)),
);
const proj = { title: "T", description: "a".repeat(20), techTags: "React, Node", link: "" };
t("project ok", ok(projectSchema, proj));
t(
  "project title 80/81",
  ok(projectSchema, { ...proj, title: "a".repeat(80) }) &&
    !ok(projectSchema, { ...proj, title: "a".repeat(81) }),
);
t(
  "project desc 500/501",
  ok(projectSchema, { ...proj, description: "a".repeat(500) }) &&
    !ok(projectSchema, { ...proj, description: "a".repeat(501) }),
);
const exp = {
  type: "hackathon",
  title: "Dev",
  organisation: "HackFest",
  startMonth: "2025-11",
  endMonth: "",
  description: "",
};
t("experience ok", ok(experienceSchema, exp));
t(
  "experience desc 500/501",
  ok(experienceSchema, { ...exp, description: "a".repeat(500) }) &&
    !ok(experienceSchema, { ...exp, description: "a".repeat(501) }),
);
t("experience end before start fails", !ok(experienceSchema, { ...exp, endMonth: "2025-01" }));
t(
  "password min 8",
  !ok(createPasswordSchema, { password: "1234567", confirm: "1234567" }) &&
    ok(createPasswordSchema, { password: "12345678", confirm: "12345678" }),
);
t("password mismatch", !ok(createPasswordSchema, { password: "12345678", confirm: "123456789" }));
t(
  "change pw",
  ok(changePasswordSchema, { currentPassword: "x", password: "12345678", confirm: "12345678" }) &&
    !ok(changePasswordSchema, { currentPassword: "", password: "12345678", confirm: "12345678" }),
);
t(
  "login email",
  !ok(loginSchema, { email: "bad", password: "x" }) && ok(loginSchema, { email: "a@b.co", password: "x" }),
);
t(
  "feedback 1000",
  ok(feedbackSchema, { message: "a".repeat(1000), email: "" }) &&
    !ok(feedbackSchema, { message: "a".repeat(1001), email: "" }),
);
t(
  "team",
  ok(teamSchema, { name: "Squad", eventId: "e", myRole: "Dev", memberIds: [] }) &&
    !ok(teamSchema, { name: "Squad", eventId: "", myRole: "Dev", memberIds: [] }),
);
const file = (type: string, mb: number) => ({ type, size: mb * 1024 * 1024 }) as File;
t(
  "image 5MB",
  validateImage(file("image/png", 5)) === null &&
    validateImage(file("image/png", 5.1)) !== null &&
    validateImage(file("image/gif", 1)) !== null,
);
console.log(f ? f + " FAILED" : "ALL PASSED");
