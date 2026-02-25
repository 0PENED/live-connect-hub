import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Shield, User } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { currentUser, users, updateProfile, createUser, deleteUser } = useAuth();
  const [name, setName] = useState(currentUser?.name ?? "");
  const [avatar, setAvatar] = useState(currentUser?.avatar ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");

  const handleSave = () => {
    if (!name.trim()) return;
    updateProfile(name.trim(), avatar.trim() || undefined);
    toast.success("Profile updated");
  };

  const handleCreateUser = () => {
    const err = createUser(newId, newName);
    if (err) { toast.error(err); return; }
    toast.success("Account created");
    setNewId(""); setNewName(""); setCreateOpen(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      {/* Profile section */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Profile</h2>
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold overflow-hidden">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                currentUser?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                {currentUser?.name}
                {currentUser?.isAdmin && <Shield className="h-4 w-4 text-primary" />}
              </p>
              <p className="text-sm text-muted-foreground">{currentUser?.id}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Display Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-background" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Profile Photo URL</label>
            <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." className="bg-background" />
          </div>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>

      {/* Admin: Manage Users */}
      {currentUser?.isAdmin && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Manage Users</h2>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-3 w-3 mr-1" />Create Account</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Account</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <Input placeholder="ID (e.g. user@email.com)" value={newId} onChange={(e) => setNewId(e.target.value)} className="bg-background" />
                  <Input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-background" />
                  <p className="text-xs text-muted-foreground">Access code will be: LIVER</p>
                  <Button onClick={handleCreateUser} className="w-full">Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-5 py-3 group">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-foreground text-xs font-bold">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      {user.name}
                      {user.isAdmin && <Shield className="h-3 w-3 text-primary" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.id}</p>
                  </div>
                </div>
                {!user.isAdmin && (
                  <button
                    onClick={() => { deleteUser(user.id); toast.success("Account deleted"); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
