/**
 * Pure FormData → record mapping for the schema-driven editor.
 * Kept free of server/framework imports so it is unit-testable.
 */
import type { FieldDef } from "./admin-schema.ts";
import { slugify } from "./text.ts";

type Rec = Record<string, unknown>;

export function getPath(obj: Rec, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Rec)[k] : undefined), obj);
}

export function setPath(obj: Rec, path: string, value: unknown) {
  const keys = path.split(".");
  let o = obj;
  for (const k of keys.slice(0, -1)) {
    if (!o[k] || typeof o[k] !== "object") o[k] = {};
    o = o[k] as Rec;
  }
  const last = keys[keys.length - 1];
  if (value === undefined) delete o[last];
  else o[last] = value;
}

const GOV = {
  status: ["draft", "published", "archived"],
  visibility: ["public", "restricted", "hidden"],
  consent: ["granted", "pending", "declined", "not_required"],
  review: ["unreviewed", "needs_review", "verified"],
} as const;

export interface FormResult { errors: Record<string, string> }

/** Applies submitted values onto `rec` (mutates). Image fields are handled by the caller. */
export function applyForm(rec: Rec, fields: FieldDef[], form: FormData): FormResult {
  const errors: Record<string, string> = {};
  const str = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v.trim() : "";
  };

  for (const f of fields) {
    switch (f.type) {
      case "text": case "textarea": case "markdown": case "url": {
        const v = str(f.name);
        if (f.type === "url" && v && !/^https?:\/\//i.test(v)) errors[f.name] = "URL phải bắt đầu bằng http(s)://";
        if (f.required && !v) errors[f.name] = "Bắt buộc";
        setPath(rec, f.name, v || undefined);
        break;
      }
      case "select": {
        const v = str(f.name);
        if (v && !(v in f.options)) errors[f.name] = "Giá trị không hợp lệ";
        else if (f.required && !v) errors[f.name] = "Bắt buộc";
        setPath(rec, f.name, v || undefined);
        break;
      }
      case "number": {
        const v = str(f.name);
        const n = Number(v);
        if (v && !Number.isFinite(n)) errors[f.name] = "Phải là số";
        setPath(rec, f.name, v ? n : undefined);
        break;
      }
      case "checkbox":
        setPath(rec, f.name, form.get(f.name) === "on");
        break;
      case "tags":
        setPath(rec, f.name, str(f.name).split(",").map((t) => t.trim()).filter(Boolean));
        break;
      case "refs":
        setPath(rec, f.name, form.getAll(f.name).filter((v): v is string => typeof v === "string" && v.length > 0));
        break;
      case "ref":
        setPath(rec, f.name, str(f.name) || undefined);
        break;
      case "fuzzydate": {
        const value = str(`${f.name}.value`);
        if (!value) { setPath(rec, f.name, undefined); break; }
        const m = value.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/);
        if (!m) { errors[f.name] = "Dạng YYYY, YYYY-MM hoặc YYYY-MM-DD"; break; }
        const precision = m[3] ? "day" : m[2] ? "month" : "year";
        setPath(rec, f.name, { value, precision, ...(form.get(`${f.name}.approximate`) === "on" ? { approximate: true } : {}) });
        break;
      }
      case "image":
        break;
    }
  }

  for (const [k, allowed] of Object.entries(GOV)) {
    const v = str(k);
    if ((allowed as readonly string[]).includes(v)) rec[k] = v;
  }
  rec.demo = form.get("demo") === "on" ? true : undefined;

  if (!rec.slug && typeof rec.title === "string") rec.slug = slugify(rec.title);
  if (typeof rec.slug === "string") {
    rec.slug = slugify(rec.slug);
    if (!rec.slug) errors.slug = "Không tạo được đường dẫn";
  }
  return { errors };
}
