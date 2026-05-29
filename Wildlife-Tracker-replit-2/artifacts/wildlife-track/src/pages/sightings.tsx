import { useState } from "react";
import { useListSightings, useGetAnimalCounts, useGetRecentSightings } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Clock } from "lucide-react";

export default function Sightings() {
  const [search, setSearch] = useState("");
  const [filterAnimal, setFilterAnimal] = useState("all");

  const { data: sightings, isLoading } = useListSightings();
  const { data: animalCounts } = useGetAnimalCounts();
  const { data: recent } = useGetRecentSightings();

  const filtered = (sightings ?? []).filter((s) => {
    const matchesSearch =
      !search ||
      s.animalType.toLowerCase().includes(search.toLowerCase()) ||
      s.userName.toLowerCase().includes(search.toLowerCase()) ||
      (s.notes ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterAnimal === "all" || s.animalType === filterAnimal;
    return matchesSearch && matchesFilter;
  });

  const uniqueAnimals = Array.from(new Set((sightings ?? []).map((s) => s.animalType)));

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Sightings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {recent?.length ?? 0} sightings in last 24h
          </p>
        </div>
      </div>

      {/* Animal count breakdown */}
      {animalCounts && animalCounts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {animalCounts.map((ac) => (
            <button
              key={ac.animalType}
              onClick={() => setFilterAnimal(ac.animalType === filterAnimal ? "all" : ac.animalType)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                filterAnimal === ac.animalType
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
              data-testid={`filter-animal-${ac.animalType}`}
            >
              {ac.animalType} <span className="opacity-70">({ac.count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search sightings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-sightings"
          />
        </div>
        <Select value={filterAnimal} onValueChange={setFilterAnimal}>
          <SelectTrigger className="w-48" data-testid="select-filter-animal">
            <SelectValue placeholder="All animals" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All animals</SelectItem>
            {uniqueAnimals.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading sightings...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Animal</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Reporter</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Location</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Time</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Notes</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">No sightings found</td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors" data-testid={`row-sighting-${s.id}`}>
                    <td className="p-3 font-medium">{s.animalType}</td>
                    <td className="p-3 text-muted-foreground">{s.userName}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(s.timestamp).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground max-w-xs truncate">{s.notes ?? "-"}</td>
                    <td className="p-3">
                      {s.notificationsSuppressed ? (
                        <Badge variant="secondary">Suppressed</Badge>
                      ) : (
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Active</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
