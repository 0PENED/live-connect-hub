import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ChatRoom, ChatMessage } from "@/types";
import { getStorage, setStorage } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, LogIn, Send, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Chat() {
  const { currentUser } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>(() => getStorage("livep_rooms", []));
  const [joinedIds, setJoinedIds] = useState<string[]>(() =>
    getStorage(`livep_joined_${currentUser?.id}`, [])
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => setStorage("livep_rooms", rooms), [rooms]);
  useEffect(() => setStorage(`livep_joined_${currentUser?.id}`, joinedIds), [joinedIds, currentUser]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [rooms, selectedId]);

  // Poll for new messages every 2s
  useEffect(() => {
    const interval = setInterval(() => {
      setRooms(getStorage("livep_rooms", []));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const joinedRooms = rooms.filter((r) => joinedIds.includes(r.id));
  const selectedRoom = rooms.find((r) => r.id === selectedId);

  const handleCreate = () => {
    if (!newName.trim() || !newCode.trim()) { setError("Name and code required"); return; }
    const room: ChatRoom = { id: crypto.randomUUID(), name: newName.trim(), openCode: newCode.trim(), messages: [] };
    setRooms((p) => [...p, room]);
    setJoinedIds((p) => [...p, room.id]);
    setSelectedId(room.id);
    setNewName(""); setNewCode(""); setError(""); setCreateOpen(false);
  };

  const handleJoin = () => {
    const room = rooms.find((r) => r.openCode === joinCode.trim());
    if (!room) { setError("Invalid code"); return; }
    if (joinedIds.includes(room.id)) { setError("Already joined"); return; }
    setJoinedIds((p) => [...p, room.id]);
    setSelectedId(room.id);
    setJoinCode(""); setError(""); setJoinOpen(false);
  };

  const sendMessage = () => {
    if (!message.trim() || !selectedRoom || !currentUser) return;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      userName: currentUser.name,
      text: message.trim(),
      timestamp: Date.now(),
    };
    setRooms((prev) =>
      prev.map((r) => (r.id === selectedRoom.id ? { ...r, messages: [...r.messages, msg] } : r))
    );
    setMessage("");
  };

  return (
    <div className="flex h-screen">
      {/* Room list */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground mb-3">Chat Rooms</h2>
          <div className="flex gap-2">
            {currentUser?.isAdmin && (
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex-1 text-xs"><Plus className="h-3 w-3 mr-1" />Create</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Chat Room</DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    <Input placeholder="Room name" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-background" />
                    <Input placeholder="Open code" value={newCode} onChange={(e) => setNewCode(e.target.value)} className="bg-background" />
                    {error && <p className="text-destructive text-sm">{error}</p>}
                    <Button onClick={handleCreate} className="w-full">Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="flex-1 text-xs"><LogIn className="h-3 w-3 mr-1" />Join</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Join Chat Room</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <Input placeholder="Enter open code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} className="bg-background" />
                  {error && <p className="text-destructive text-sm">{error}</p>}
                  <Button onClick={handleJoin} className="w-full">Join</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {joinedRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedId(room.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                  selectedId === room.id
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Hash className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{room.name}</span>
              </button>
            ))}
            {joinedRooms.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8 px-4">No rooms yet. Join or create one!</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">{selectedRoom.name}</h3>
              <span className="text-xs text-muted-foreground ml-auto">{selectedRoom.messages.length} messages</span>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3 max-w-3xl">
                {selectedRoom.messages.map((msg) => {
                  const isOwn = msg.userId === currentUser?.id;
                  return (
                    <div key={msg.id} className={cn("flex", isOwn && "justify-end")}>
                      <div className={cn("max-w-[70%] rounded-xl px-4 py-2.5", isOwn ? "bg-chat-own" : "bg-chat-other")}>
                        {!isOwn && <p className="text-xs font-medium text-primary mb-1">{msg.userName}</p>}
                        <p className="text-sm text-foreground">{msg.text}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex gap-2 max-w-3xl"
              >
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="bg-card border-border"
                />
                <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Select a room to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
