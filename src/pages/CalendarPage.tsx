import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarSpace, Schedule } from "@/types";
import { getStorage, setStorage } from "@/lib/storage";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, LogIn, CalendarDays, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

export default function CalendarPage() {
  const { currentUser } = useAuth();
  const [calendars, setCalendars] = useState<CalendarSpace[]>(() => getStorage("livep_calendars", []));
  const [joinedIds, setJoinedIds] = useState<string[]>(() =>
    getStorage(`livep_cal_joined_${currentUser?.id}`, [])
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [schedTitle, setSchedTitle] = useState("");
  const [schedDesc, setSchedDesc] = useState("");
  const [error, setError] = useState("");

  useEffect(() => setStorage("livep_calendars", calendars), [calendars]);
  useEffect(() => setStorage(`livep_cal_joined_${currentUser?.id}`, joinedIds), [joinedIds, currentUser]);

  const joinedCalendars = calendars.filter((c) => joinedIds.includes(c.id));
  const selectedCal = calendars.find((c) => c.id === selectedId);
  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const daySchedules = selectedCal?.schedules.filter((s) => s.date === dateStr) ?? [];

  const handleCreate = () => {
    if (!newName.trim() || !newCode.trim()) { setError("Name and code required"); return; }
    const cal: CalendarSpace = { id: crypto.randomUUID(), name: newName.trim(), openCode: newCode.trim(), schedules: [] };
    setCalendars((p) => [...p, cal]);
    setJoinedIds((p) => [...p, cal.id]);
    setSelectedId(cal.id);
    setNewName(""); setNewCode(""); setError(""); setCreateOpen(false);
  };

  const handleJoin = () => {
    const cal = calendars.find((c) => c.openCode === joinCode.trim());
    if (!cal) { setError("Invalid code"); return; }
    if (joinedIds.includes(cal.id)) { setError("Already joined"); return; }
    setJoinedIds((p) => [...p, cal.id]);
    setSelectedId(cal.id);
    setJoinCode(""); setError(""); setJoinOpen(false);
  };

  const addSchedule = () => {
    if (!schedTitle.trim() || !selectedCal || !dateStr) return;
    const sched: Schedule = { id: crypto.randomUUID(), title: schedTitle.trim(), date: dateStr, description: schedDesc.trim() || undefined };
    setCalendars((prev) =>
      prev.map((c) => (c.id === selectedCal.id ? { ...c, schedules: [...c.schedules, sched] } : c))
    );
    setSchedTitle(""); setSchedDesc(""); setScheduleOpen(false);
  };

  const deleteSchedule = (schedId: string) => {
    if (!selectedCal) return;
    setCalendars((prev) =>
      prev.map((c) => (c.id === selectedCal.id ? { ...c, schedules: c.schedules.filter((s) => s.id !== schedId) } : c))
    );
  };

  const deleteCal = (calId: string) => {
    setCalendars((p) => p.filter((c) => c.id !== calId));
    setJoinedIds((p) => p.filter((id) => id !== calId));
    if (selectedId === calId) setSelectedId(null);
  };

  // Dates that have schedules
  const scheduleDates = selectedCal?.schedules.map((s) => new Date(s.date + "T00:00:00")) ?? [];

  return (
    <div className="flex h-screen">
      {/* Calendar list */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground mb-3">Calendars</h2>
          <div className="flex gap-2">
            {currentUser?.isAdmin && (
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex-1 text-xs"><Plus className="h-3 w-3 mr-1" />Create</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Calendar</DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    <Input placeholder="Calendar name" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-background" />
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
                <DialogHeader><DialogTitle>Join Calendar</DialogTitle></DialogHeader>
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
            {joinedCalendars.map((cal) => (
              <div key={cal.id} className="flex items-center group">
                <button
                  onClick={() => setSelectedId(cal.id)}
                  className={cn(
                    "flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                    selectedId === cal.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{cal.name}</span>
                </button>
                {currentUser?.isAdmin && (
                  <button onClick={() => deleteCal(cal.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            {joinedCalendars.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8 px-4">No calendars yet. Join or create one!</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Calendar view */}
      <div className="flex-1 flex flex-col p-6 overflow-auto">
        {selectedCal ? (
          <>
            <h3 className="font-semibold text-foreground text-lg mb-4">{selectedCal.name}</h3>
            <div className="flex gap-8 flex-wrap">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-lg border border-border bg-card p-3 pointer-events-auto"
                modifiers={{ hasEvent: scheduleDates }}
                modifiersClassNames={{ hasEvent: "bg-primary/20 text-primary font-bold" }}
              />

              <div className="flex-1 min-w-[300px]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-foreground">
                    {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
                  </h4>
                  {currentUser?.isAdmin && selectedDate && (
                    <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm"><Plus className="h-3 w-3 mr-1" />Add</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Add Schedule</DialogTitle></DialogHeader>
                        <div className="space-y-3 pt-2">
                          <Input placeholder="Title" value={schedTitle} onChange={(e) => setSchedTitle(e.target.value)} className="bg-background" />
                          <Textarea placeholder="Description (optional)" value={schedDesc} onChange={(e) => setSchedDesc(e.target.value)} className="bg-background" />
                          <Button onClick={addSchedule} className="w-full">Add Schedule</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                <div className="space-y-2">
                  {daySchedules.map((s) => (
                    <div key={s.id} className="bg-card border border-border rounded-lg p-4 flex items-start justify-between group">
                      <div>
                        <p className="font-medium text-foreground text-sm">{s.title}</p>
                        {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}
                      </div>
                      {currentUser?.isAdmin && (
                        <button onClick={() => deleteSchedule(s.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {daySchedules.length === 0 && selectedDate && (
                    <p className="text-sm text-muted-foreground py-4">No schedules for this date</p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Select a calendar to view schedules</p>
          </div>
        )}
      </div>
    </div>
  );
}
