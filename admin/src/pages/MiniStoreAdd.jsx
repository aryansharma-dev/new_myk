import { useState } from "react";
import { toast } from "react-toastify";
import { api } from "../lib/api";

export default function MiniStoreAdd() {
  const [form, setForm] = useState({
    slug: "", displayName: "", bio: "",
    avatarUrl: "", bannerUrl: "", productsCsv: ""
  });
  const [saving, setSaving] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
      if (!form.displayName.trim()) {
      toast.error("Display name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        slug: form.slug,
        displayName: form.displayName,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
        bannerUrl: form.bannerUrl,
      };
      if (form.productsCsv.trim()) {
        payload.products = form.productsCsv.split(",").map(s => s.trim()).filter(Boolean);
      }
            const data = await api("/ministores", { method: "POST", body: payload });
      toast.success("Mini store created");
      setForm({ slug:"", displayName:"", bio:"", avatarUrl:"", bannerUrl:"", productsCsv:"" });
      return data;
    } catch (err) {
          const message = err?.response?.data?.message || err.message;
      toast.error(message);
    } finally { setSaving(false); }
  };

  return (
    <div className="p-4 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Create Mini Store</h1>
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-1">
                  <span className="text-sm">Slug (optional)</span>
          <input name="slug" value={form.slug} onChange={onChange} className="border p-2 rounded" placeholder="auto-generated if blank" />       
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Display Name</span>
          <input name="displayName" value={form.displayName} onChange={onChange} className="border p-2 rounded" required />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Bio (optional)</span>
          <textarea name="bio" value={form.bio} onChange={onChange} className="border p-2 rounded" rows={3} />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Avatar URL</span>
          <input name="avatarUrl" value={form.avatarUrl} onChange={onChange} className="border p-2 rounded" />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Banner URL</span>
          <input name="bannerUrl" value={form.bannerUrl} onChange={onChange} className="border p-2 rounded" />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Products (IDs, comma-separated)</span>
          <input name="productsCsv" value={form.productsCsv} onChange={onChange} className="border p-2 rounded" placeholder="64f...a1, 64f...b2" />
        </label>

        <button disabled={saving} className="bg-black text-white rounded px-4 py-2">
          {saving ? "Saving..." : "Create"}
        </button>
      </form>
    </div>
  );
}
