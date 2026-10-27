import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { useMock } from "../../store/MockContext";
import { formatFullDateTime } from "../../lib/utils";
import { IconBookOpen, IconCalendar, IconChat, IconFile } from "../../components/icons";

type Tab = "discussion" | "resources" | "schedule" | "rules";
const unavailable = "This feature is not connected to persistent storage yet. No content or changes are being saved here.";

export function GroupWorkspace() {
  const { groupId } = useParams<{ groupId: string }>();
  const { currentUser, groups, memberships, posts, resources, sessions, rules, acknowledgements, users, createPost, deletePost } = useMock();
  const group = groups.find((g) => g.id === groupId);
  const [tab, setTab] = useState<Tab>("discussion");
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  if (!currentUser) return <Navigate to="/login" replace />;
  if (!group) return <EmptyState title="Group not found" description="This group may have been removed or is not available to your account." />;
  const membership = memberships.find((m) => m.group_id === groupId && m.student_id === currentUser.id && m.status === "ACTIVE");
  if (!membership) return <EmptyState title="Join the group to open the workspace" description="The group workspace is private. Send a join request and wait for administrator approval." action={<Link to={`/groups/${group.id}`}><Button size="sm">Go to group</Button></Link>} />;

  const isAdmin = membership.role === "ADMIN";
  const groupPosts = posts.filter((post) => post.group_id === group.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const groupResources = resources.filter((resource) => resource.group_id === group.id);
  const groupSessions = sessions.filter((session) => session.group_id === group.id).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const groupRules = rules.filter((rule) => rule.group_id === group.id).sort((a, b) => b.version - a.version);
  const latestRule = groupRules[0];
  const acknowledgement = latestRule ? acknowledgements.find((item) => item.group_id === group.id && item.student_id === currentUser.id && item.rule_version === latestRule.version) : undefined;
  const tabs: Array<{ id: Tab; label: string; icon: typeof IconChat }> = [
    { id: "discussion", label: "Discussion", icon: IconChat },
    { id: "resources", label: "Resources", icon: IconFile },
    { id: "schedule", label: "Schedule", icon: IconCalendar },
    { id: "rules", label: "Rules", icon: IconBookOpen },
  ];

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;
    setPostError(null);
    setPosting(true);
    const result = await createPost(groupId, postContent);
    setPosting(false);
    if (result.ok) {
      setPostContent("");
    } else {
      setPostError(result.error ?? "Failed to post.");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    await deletePost(postId);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to={`/groups/${group.id}`}
            className="text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400 transition-colors"
          >
            ← Back to {group.name}
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Group workspace
          </h1>
        </div>
        {isAdmin ? (
          <Link to={`/groups/${group.id}/admin`}>
            <Button size="sm" variant="outline">Admin panel</Button>
          </Link>
        ) : null}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Group workspace sections">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2.5 whitespace-nowrap rounded-2xl px-5 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>
      {tab === "discussion" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Discussion</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Member-only conversation about {group.name}.
            </p>
            <form onSubmit={handlePost} className="mt-4 space-y-3">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Share something with your group..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                rows={3}
                maxLength={2000}
              />
              {postError ? <p className="text-sm text-red-600 dark:text-red-400">{postError}</p> : null}
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">{postContent.length}/2000</p>
                <Button type="submit" size="sm" disabled={posting || postContent.trim().length < 1}>
                  {posting ? "Posting..." : "Post"}
                </Button>
              </div>
            </form>
            {groupPosts.length ? (
              <div className="mt-6 space-y-4">
                {groupPosts.map((post) => {
                  const author = users.find((user) => user.id === post.author_id);
                  const canDelete = post.author_id === currentUser.id || isAdmin;
                  return (
                    <div key={post.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {author?.display_name ?? "Member"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">{formatFullDateTime(post.created_at)}</p>
                        </div>
                        {canDelete ? (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-xs text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{post.content}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">No posts yet. Start the conversation!</p>
            )}
          </Card>
          <Alert variant="info" title="Real discussion">Posts are saved to Supabase and visible to all group members.</Alert>
        </div>
      ) : null}
      {tab === "resources" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Shared resources</h2>
            {groupResources.length ? (
              <ul className="mt-4 space-y-2">
                {groupResources.map((resource) => (
                  <li key={resource.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{resource.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{resource.description}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No saved resources.</p>
            )}
          </Card>
          <Alert variant="info" title="Resource sharing is unavailable">{unavailable}</Alert>
        </div>
      ) : null}
      {tab === "schedule" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Study sessions</h2>
            {groupSessions.length ? (
              <div className="mt-4 space-y-3">
                {groupSessions.map((session) => (
                  <div key={session.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{session.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatFullDateTime(session.starts_at)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No saved sessions.</p>
            )}
          </Card>
          <Alert variant="info" title="Scheduling is unavailable">{unavailable}</Alert>
        </div>
      ) : null}
      {tab === "rules" ? (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Rules</h2>
          {latestRule ? (
            <>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Version {latestRule.version} of the group rules.</p>
              <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {latestRule.content}
              </pre>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {acknowledgement ? `Acknowledged version ${acknowledgement.rule_version}.` : "Acknowledgement status is not saved in this release."}
              </p>
            </>
          ) : (
            <Alert variant="info" title="Rules are not available yet">
              {unavailable} Do not interpret an empty rules panel as a group having no rules.
            </Alert>
          )}
        </Card>
      ) : null}
    </div>
  );
}
