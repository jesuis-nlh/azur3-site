"use client";

import { useActionState } from "react";
import type { FieldDef } from "@/lib/admin-schema";
import type { MediaAsset } from "@/lib/types";
import type { SaveState } from "@/app/admin/actions";
import { GOVERNANCE_LABELS } from "@/lib/governance";

type Rec = Record<string, unknown>;
const get = (o: Rec, p: string): unknown => p.split(".").reduce<unknown>((x, k) => (x && typeof x === "object" ? (x as Rec)[k] : undefined), o);

export default function RecordEditor({
  action, record, fields, options, isAlbum,
}: {
  action: (state: SaveState, form: FormData) => Promise<SaveState>;
  record: Rec;
  fields: FieldDef[];
  options: Record<string, { id: string; title: string }[]>;
  isAlbum: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.errors ?? {};
  const uncertain = (record.uncertain as string[] | undefined) ?? [];

  const field = (f: FieldDef) => {
    const v = get(record, f.name);
    const id = `f-${f.name}`;
    const err = errors[f.name] ? <p className="admin-error">{errors[f.name]}</p> : null;
    const hint = f.hint ? <p className="admin-hint">{f.hint}</p> : null;
    const flag = uncertain.includes(f.name) ? <span className="gov__b is-warn">cần xác minh</span> : null;
    const label = <label htmlFor={id}>{f.label}{"required" in f && f.required ? " *" : ""} {flag}</label>;
    switch (f.type) {
      case "text": case "url":
        return <div className="admin-field" key={f.name}>{label}<input id={id} name={f.name} type={f.type === "url" ? "url" : "text"} defaultValue={(v as string) ?? ""} className="admin-input" aria-invalid={!!errors[f.name]} />{hint}{err}</div>;
      case "number":
        return <div className="admin-field" key={f.name}>{label}<input id={id} name={f.name} type="number" defaultValue={(v as number) ?? ""} className="admin-input" />{hint}{err}</div>;
      case "textarea": case "markdown":
        return <div className="admin-field admin-field--wide" key={f.name}>{label}<textarea id={id} name={f.name} defaultValue={(v as string) ?? ""} rows={f.type === "markdown" ? 18 : 4} className={`admin-input${f.type === "markdown" ? " admin-input--mono" : ""}`} aria-invalid={!!errors[f.name]} />{hint}{err}</div>;
      case "select":
        return <div className="admin-field" key={f.name}>{label}<select id={id} name={f.name} defaultValue={(v as string) ?? ""} className="admin-input"><option value="">—</option>{Object.entries(f.options).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>{hint}{err}</div>;
      case "checkbox":
        return <div className="admin-field" key={f.name}><label className="admin-check"><input type="checkbox" name={f.name} defaultChecked={!!v} /> {f.label}</label>{hint}</div>;
      case "tags":
        return <div className="admin-field" key={f.name}>{label}<input id={id} name={f.name} defaultValue={((v as string[]) ?? []).join(", ")} className="admin-input" />{hint}{err}</div>;
      case "ref":
        return <div className="admin-field" key={f.name}>{label}<select id={id} name={f.name} defaultValue={(v as string) ?? ""} className="admin-input"><option value="">— không —</option>{(options[f.collection] ?? []).map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}</select>{hint}</div>;
      case "refs":
        return (
          <fieldset className="admin-field admin-field--wide" key={f.name}>
            <legend>{f.label}</legend>
            <div className="admin-refs">
              {(options[f.collection] ?? []).map((o) => (
                <label key={o.id} className="admin-check"><input type="checkbox" name={f.name} value={o.id} defaultChecked={((v as string[]) ?? []).includes(o.id)} /> {o.title}</label>
              ))}
            </div>
            {hint}
          </fieldset>
        );
      case "fuzzydate": {
        const d = v as { value?: string; approximate?: boolean } | undefined;
        return (
          <div className="admin-field" key={f.name}>{label}
            <input id={id} name={`${f.name}.value`} defaultValue={d?.value ?? ""} placeholder="2023 · 2023-11 · 2023-11-20" className="admin-input" aria-invalid={!!errors[f.name]} />
            <label className="admin-check"><input type="checkbox" name={`${f.name}.approximate`} defaultChecked={!!d?.approximate} /> Ước tính (chưa chắc)</label>
            {hint}{err}
          </div>
        );
      }
      case "image": {
        const a = v as MediaAsset | undefined;
        return (
          <div className="admin-field admin-field--wide" key={f.name}>{label}
            <div className="admin-image">
              {a ? <img src={a.thumb ?? a.src} alt="" /> : <span className="admin-muted">Chưa có ảnh</span>}
              <div className="admin-image__ctrl">
                <input type="file" name={`${f.name}__file`} accept="image/jpeg,image/png,image/webp" aria-label={`Tải ${f.label}`} />
                <input name={`${f.name}__alt`} defaultValue={a?.alt ?? ""} placeholder="Mô tả ảnh cho người dùng trình đọc màn hình" className="admin-input" aria-label="Văn bản thay thế" />
                {a ? <label className="admin-check"><input type="checkbox" name={`${f.name}__remove`} /> Gỡ ảnh</label> : null}
              </div>
            </div>
            {err}
          </div>
        );
      }
    }
  };

  const assets = (record.assets as MediaAsset[] | undefined) ?? [];

  return (
    <form action={formAction} className="admin-editor">
      <div className="admin-editor__main">
        <div className="admin-grid">{fields.map(field)}</div>

        {isAlbum ? (
          <fieldset className="admin-assets">
            <legend>Ảnh trong album ({assets.length})</legend>
            <ul>
              {assets.map((a, i) => (
                <li key={a.id}>
                  <img src={a.thumb ?? a.src} alt="" />
                  <div className="admin-assets__fields">
                    <input name={`asset.${i}.alt`} defaultValue={a.alt} className="admin-input" aria-label={`Mô tả ảnh ${i + 1}`} placeholder="Văn bản thay thế (bắt buộc)" />
                    <input name={`asset.${i}.caption`} defaultValue={a.caption ?? ""} className="admin-input" aria-label={`Chú thích ảnh ${i + 1}`} placeholder="Chú thích — chỉ ghi điều đã biết chắc" />
                    <input name={`asset.${i}.photographer`} defaultValue={a.photographer ?? ""} className="admin-input" aria-label={`Người chụp ảnh ${i + 1}`} placeholder="Người chụp" />
                    <div className="admin-assets__row">
                      <label className="admin-check"><input type="radio" name="coverId" value={a.id} defaultChecked={record.coverId === a.id} /> Ảnh bìa</label>
                      <label className="admin-check"><input type="checkbox" name={`asset.${i}.remove`} /> Gỡ</label>
                      {a.sha256 ? <code title="SHA-256">{a.sha256.slice(0, 10)}</code> : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <label className="admin-field">Thêm ảnh<input type="file" name="newAssets" multiple accept="image/jpeg,image/png,image/webp,image/heic" /></label>
            {errors.newAssets ? <p className="admin-error">{errors.newAssets}</p> : null}
          </fieldset>
        ) : null}
      </div>

      <aside className="admin-editor__side">
        <fieldset className="admin-gov">
          <legend>Xuất bản & quyền riêng tư</legend>
          <p className="admin-hint">Chỉ hiển thị công khai khi: <b>Đã xuất bản</b> + <b>Công khai</b> + đồng ý <b>Đã đồng ý / Không cần</b>.</p>
          {(["status", "visibility", "consent", "review"] as const).map((k) => (
            <div className="admin-field" key={k}>
              <label htmlFor={`g-${k}`}>{{ status: "Trạng thái", visibility: "Hiển thị", consent: "Sự đồng ý", review: "Xác minh" }[k]}</label>
              <select id={`g-${k}`} name={k} defaultValue={record[k] as string} className="admin-input">
                {Object.entries(GOVERNANCE_LABELS[k]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
          <label className="admin-check"><input type="checkbox" name="demo" defaultChecked={!!record.demo} /> Nội dung mẫu (hiện nhãn “Mẫu”)</label>
        </fieldset>
        <button type="submit" className="admin-btn admin-btn--block" disabled={pending}>{pending ? "Đang lưu…" : "Lưu"}</button>
        {state.message ? <p role="status" className={state.ok ? "admin-ok" : "admin-error"}>{state.message}</p> : null}
      </aside>
    </form>
  );
}
