import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetSightings } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const ANIMAL_TYPES = [
  "ALL", "BIRD", "MAMMAL", "REPTILE", "AMPHIBIAN", "INSECT", "FISH", 
  "DEER", "FOX", "BEAR", "WOLF", "EAGLE", "OWL", "SNAKE", 
  "TURTLE", "FROG", "ALLIGATOR", "MONKEY", "JAGUAR", "OTHER"
];

export default function Sightings() {
  const [animalFilter, setAnimalFilter] = useState<string>("ALL");
  const { data: sightings, isLoading } = useGetSightings(
    animalFilter !== "ALL" ? { animalType: animalFilter } : undefined
  );

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto w-full flex flex-col h-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Wildlife Log</h1>
            <p className="text-muted-foreground">Historical record of all tracked animals.</p>
          </div>
          <div className="w-full sm:w-48">
            <Select value={animalFilter} onValueChange={setAnimalFilter}>
              <SelectTrigger data-testid="filter-animal">
                <SelectValue placeholder="Filter by animal" />
              </SelectTrigger>
              <SelectContent>
                {ANIMAL_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type === "ALL" ? "All Animals" : type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border flex-1 overflow-hidden bg-card flex flex-col">
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Animal</TableHead>
                  <TableHead>Observer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Loading records...</TableCell>
                  </TableRow>
                ) : sightings?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No sightings found.</TableCell>
                  </TableRow>
                ) : (
                  sightings?.map((sighting) => (
                    <TableRow key={sighting.id}>
                      <TableCell className="whitespace-nowrap font-medium text-xs">
                        {format(new Date(sighting.timestamp), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                          {sighting.animalType}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{sighting.userName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {sighting.lat.toFixed(4)}, {sighting.lng.toFixed(4)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm" title={sighting.description || ""}>
                        {sighting.description || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
