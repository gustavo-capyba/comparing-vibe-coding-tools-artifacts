import { useState } from "react";
import { useListSightings, getListSightingsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, MapPin, Clock, Users } from "lucide-react";

const ANIMAL_TYPES = [
  "Jaguar", "Capybara", "Anaconda", "Toucan", "Tapir",
  "Caiman", "Peccary", "Armadillo", "Howler Monkey", "Giant Anteater"
];

export default function Sightings() {
  const [filterAnimal, setFilterAnimal] = useState("all");

  const { data: sightings = [], isLoading } = useListSightings(
    filterAnimal !== "all" ? { animalType: filterAnimal } : undefined,
    {
      query: {
        queryKey: getListSightingsQueryKey(filterAnimal !== "all" ? { animalType: filterAnimal } : undefined),
      },
    }
  );

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wildlife Sightings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLoading ? "Loading..." : `${sightings.length} sighting${sightings.length !== 1 ? "s" : ""} recorded`}
          </p>
        </div>
        <Select value={filterAnimal} onValueChange={setFilterAnimal}>
          <SelectTrigger className="w-48" data-testid="select-animal-filter">
            <SelectValue placeholder="Filter by species" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All species</SelectItem>
            {ANIMAL_TYPES.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : sightings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No sightings found</p>
          <p className="text-sm mt-1">Go to the map to report a sighting</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sightings.map((sighting) => {
            const isCrowded = sighting.crowdCount >= 5;
            return (
              <Card
                key={sighting.id}
                className={`overflow-hidden transition-all ${isCrowded ? "border-destructive/30 bg-destructive/5" : ""}`}
                data-testid={`card-sighting-${sighting.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-lg">{sighting.animalType}</span>
                        {isCrowded && (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Crowded — alerts suppressed
                          </Badge>
                        )}
                      </div>
                      {sighting.description && (
                        <p className="text-sm text-muted-foreground mt-1">{sighting.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="font-medium text-foreground">{sighting.userName}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {sighting.latitude.toFixed(4)}, {sighting.longitude.toFixed(4)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(sighting.createdAt).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {sighting.crowdCount} nearby
                        </span>
                      </div>
                    </div>
                    <div className={`text-xs font-mono px-3 py-1.5 rounded border shrink-0 ${isCrowded ? "border-destructive/30 text-destructive" : "border-primary/20 text-primary"}`}>
                      #{sighting.id}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
