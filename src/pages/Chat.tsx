import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, LogIn, Send, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatRoom {
  id: string;
  name: string;
  open_code: string;
}

interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  user_name: string;
  text: string;
  created_at: string;
}

export default function Chat() {
  const { currentUser } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchRooms = useCallback(async () => {
    const { data } = await supabase.from("chat_rooms").select("*").order("created_at");
    if (data) setRooms(data);
  }, []);

  const fetchJoinedIds = useCallback(async () => {
    if (!currentUser) return;
    const { data } = await supabase.from("user_joined_rooms").select("room_id").eq("user_id", currentUser.id);
    if (data) setJoinedIds(data.map((d) => d.room_id));
  }, [currentUser]);

  const fetchMessages = useCallback(async () => {
    if (!selectedId) return;
    const { data } = await supabase.from("chat_messages").select("*").eq("room_id", selectedId).order("created_at");
    if (data) setMessages(data);
  }, [selectedId]);

  useEffect(() => { fetchRooms(); fetchJoinedIds(); }, [fetchRooms, fetchJoinedIds]);
  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedId) return;
    const channel = supabase
      .channel(`room-${selectedId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${selectedId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedId]);

  const joinedRooms = rooms.filter((r) => joinedIds.includes(r.id));
  const selectedRoom = rooms.find((r) => r.id === selectedId);

  const handleCreate = async () => {
    if (!newName.trim() || !newCode.trim()) { setError("Name and code required"); return; }
    const { data, error: err } = await supabase.from("chat_rooms").insert({ name: newName.trim(), open_code: newCode.trim() }).select().single();
    if (err || !data) { setError(err?.message || "Error"); return; }
    await supabase.from("user_joined_rooms").insert({ user_id: currentUser!.id, room_id: data.id });
    await fetchRooms(); await fetchJoinedIds();
    setSelectedId(data.id);
    setNewName(""); setNewCode(""); setError(""); setCreateOpen(false);
  };

  const handleJoin = async () => {
    const room = rooms.find((r) => r.open_code === joinCode.trim());
    if (!room) { setError("Invalid code"); return; }
    if (joinedIds.includes(room.id)) { setError("Already joined"); return; }
    await supabase.from("user_joined_rooms").insert({ user_id: currentUser!.id, room_id: room.id });
    await fetchJoinedIds();
    setSelectedId(room.id);
    setJoinCode(""); setError(""); setJoinOpen(false);
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedRoom || !currentUser) return;
    await supabase.from("chat_messages").insert({
      room_id: selectedRoom.id,
      user_id: currentUser.id,
      user_name: currentUser.name,
      text: message.trim(),
    });
    setMessage("");
  };

  return (
    <div className="flex h-screen">
      {/* Room list */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground mb-3">Chat Rooms</h2>
          <div className="flex gap-2">
            {currentUser?.is_admin && (
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
              <span className="text-xs text-muted-foreground ml-auto">{messages.length} messages</span>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3 max-w-3xl">
                {messages.map((msg) => {
                  const isOwn = msg.user_id === currentUser?.id;
                  return (
                    <div key={msg.id} className={cn("flex", isOwn && "justify-end")}>
                      <div className={cn("max-w-[70%] rounded-xl px-4 py-2.5", isOwn ? "bg-[hsl(var(--chat-own))]" : "bg-[hsl(var(--chat-other))]")}>
                        {!isOwn && <p className="text-xs font-medium text-primary mb-1">{msg.user_name}</p>}
                        <p className="text-sm text-foreground">{msg.text}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
