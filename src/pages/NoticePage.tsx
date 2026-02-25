import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Notice } from "@/types";
import { getStorage, setStorage } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pin, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function NoticePage() {
  const { currentUser } = useAuth();
  const [notices, setNotices] = useState<Notice[]>(() => getStorage("livep_notices", []));
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => setStorage("livep_notices", notices), [notices]);

  const sorted = [...notices].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt - a.createdAt;
  });

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) return;
    const notice: Notice = {
      id: crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      pinned: false,
      createdAt: Date.now(),
      authorName: currentUser?.name ?? "Unknown",
    };
    setNotices((p) => [...p, notice]);
    setTitle(""); setContent(""); setCreateOpen(false);
  };

  const togglePin = (id: string) => {
    setNotices((p) => p.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  };

  const deleteNotice = (id: string) => {
    setNotices((p) => p.filter((n) => n.id !== id));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Notices</h2>
        {currentUser?.isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-3 w-3 mr-1" />New Notice</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Notice</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background" />
                <Textarea placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} className="bg-background min-h-[120px]" />
                <Button onClick={handleCreate} className="w-full">Post Notice</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-3">
        {sorted.map((notice) => (
          <div key={notice.id} className="bg-card border border-border rounded-lg p-5 group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {notice.pinned && <Badge variant="outline" className="text-[10px] border-primary text-primary px-1.5 py-0">Pinned</Badge>}
                  <h3 className="font-semibold text-foreground text-sm">{notice.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notice.content}</p>
                <p className="text-[11px] text-muted-foreground mt-3">
                  {notice.authorName} · {new Date(notice.createdAt).toLocaleDateString()}
                </p>
              </div>
              {currentUser?.isAdmin && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  <button onClick={() => togglePin(notice.id)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-primary transition-colors" title={notice.pinned ? "Unpin" : "Pin"}>
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteNotice(notice.id)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">No notices yet</p>
        )}
      </div>
    </div>
  );
}
