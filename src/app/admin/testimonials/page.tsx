/* eslint-disable @next/next/no-img-element */
import { connection } from "next/server";
import { ExternalLink, Eye, EyeOff, Star, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Table,
} from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { ConfirmDelete } from "@/components/confirm-delete";
import { ytThumb, ytWatch } from "@/lib/youtube";
import { createTestimonial, deleteTestimonial, setFeatured, setPublished } from "./actions";

async function getData() {
  await connection();
  return prisma.testimonial.findMany({
    orderBy: [{ published: "desc" }, { featured: "desc" }, { createdAt: "desc" }],
  });
}

const ERRORS: Record<string, string> = {
  name: "Please write the student's name.",
  link: "That doesn't look like a YouTube link. Paste the link from YouTube's Share button.",
  empty: "Add a YouTube video link or a written review (or both).",
  long: "Name up to 80 characters, course/role up to 120, review up to 1,000.",
};

export default async function TestimonialsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const items = await getData();
  const sp = await searchParams;
  const live = items.filter((t) => t.published).length;

  return (
    <div>
      <PageHeader
        title="Success Stories"
        subtitle={`Student video reviews shown on the website · ${live} live, ${items.length - live} hidden`}
        action={
          <a
            href="/testimonials"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
          >
            View on website <ExternalLink className="h-3.5 w-3.5" />
          </a>
        }
      />

      {sp.error && ERRORS[sp.error] && <Alert tone="error">{ERRORS[sp.error]}</Alert>}
      {sp.created === "published" && <Alert tone="success">Story published. It now shows on the website.</Alert>}
      {sp.created === "draft" && <Alert tone="success">Story saved as hidden. Click the eye icon to publish it.</Alert>}
      {sp.published && <Alert tone="success">Published on the website.</Alert>}
      {sp.hidden && <Alert tone="success">Hidden from the website.</Alert>}
      {sp.deleted && <Alert tone="success">Story deleted.</Alert>}

      <Card className="mb-6">
        <CardHeader title="Add a story" />
        <div className="px-5 pt-4 text-sm text-slate-500">
          1. Upload the student&apos;s video to the SkillTek YouTube channel (Public or Unlisted).
          &nbsp;2. Copy the link from YouTube&apos;s <b>Share</b> button and paste it below.
          &nbsp;3. Publish. Only add students who agreed to be shown.
        </div>
        <form action={createTestimonial} className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Student name">
            <Input name="name" required maxLength={80} placeholder="e.g. Ali Raza" />
          </Field>
          <Field label="Course / role (optional)">
            <Input name="role" maxLength={120} placeholder="e.g. CIT Student · now Freelancer" />
          </Field>
          <div className="md:col-span-2">
            <Field label="YouTube video link">
              <Input
                name="youtube"
                placeholder="https://youtu.be/… or https://youtube.com/shorts/…"
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Written review (optional, shown under the video)">
              <textarea
                name="quote"
                rows={3}
                maxLength={1000}
                placeholder="What the student says about SkillTek…"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-slate-600">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="publish" defaultChecked className="h-4 w-4 rounded" /> Publish now
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="featured" className="h-4 w-4 rounded" /> Featured (shown first and on the home page)
            </label>
          </div>
          <div className="md:col-span-2"><Button type="submit">Save story</Button></div>
        </form>
      </Card>

      <Card>
        <CardHeader title="All stories" />
        <Table head={["Video", "Student", "Status", "Added", ""]}>
          {items.map((t) => (
            <tr key={t.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                {t.youtubeId ? (
                  <a href={ytWatch(t.youtubeId)} target="_blank" rel="noopener">
                    <img src={ytThumb(t.youtubeId)} alt="" className="h-14 w-24 rounded object-cover" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">Text only</span>
                )}
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-800">{t.name}</p>
                {t.role && <p className="text-xs text-slate-500">{t.role}</p>}
                {t.quote && <p className="line-clamp-1 max-w-md text-xs text-slate-400">{t.quote}</p>}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {t.published ? <Badge tone="green">Live</Badge> : <Badge tone="gray">Hidden</Badge>}
                  {t.featured && <Badge tone="amber">Featured</Badge>}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(t.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <form action={setPublished}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="published" value={t.published ? "0" : "1"} />
                    <Button type="submit" variant="ghost" size="sm" title={t.published ? "Hide from website" : "Publish on website"}>
                      {t.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </form>
                  <form action={setFeatured}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="featured" value={t.featured ? "0" : "1"} />
                    <Button type="submit" variant="ghost" size="sm" title={t.featured ? "Remove featured" : "Make featured"}>
                      <Star className={t.featured ? "h-4 w-4 fill-amber-400 text-amber-500" : "h-4 w-4"} />
                    </Button>
                  </form>
                  <ConfirmDelete
                    action={deleteTestimonial}
                    message={`Delete ${t.name}'s story? (The YouTube video itself is not deleted.)`}
                    fields={<input type="hidden" name="id" value={t.id} />}
                  >
                    <Trash2 className="h-4 w-4" />
                  </ConfirmDelete>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No stories yet. Add the first one above.</td></tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
