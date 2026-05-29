'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Sighting } from '@/lib/types'
import { DEFAULT_LOCATION, CROWD_THRESHOLD } from '@/lib/types'
import { formatDistanceToNow } from '@/lib/date-utils'

// Fix Leaflet default marker icon issue
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const userIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const animalIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const crowdIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = defaultIcon

interface MapComponentProps {
  sightings: Sighting[]
  onLocationSelect?: (lat: number, lng: number) => void
  selectionMode?: boolean
  selectedPosition?: { lat: number; lng: number } | null
}

function LocationMarker({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null)
  const map = useMapEvents({
    click(e) {
      if (onLocationSelect) {
        setPosition(e.latlng)
        onLocationSelect(e.latlng.lat, e.latlng.lng)
      }
    },
  })

  return position ? (
    <Marker position={position} icon={defaultIcon}>
      <Popup>Local selecionado</Popup>
    </Marker>
  ) : null
}

function UserLocationButton() {
  const map = useMap()
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null)

  const handleLocate = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setUserPosition([latitude, longitude])
          map.flyTo([latitude, longitude], 15)
        },
        () => {
          // Fallback to default location
          map.flyTo([DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng], 13)
        }
      )
    }
  }

  useEffect(() => {
    handleLocate()
  }, [])

  return (
    <>
      {userPosition && (
        <Marker position={userPosition} icon={userIcon}>
          <Popup>Sua localização</Popup>
        </Marker>
      )}
      <div className="leaflet-top leaflet-right" style={{ marginTop: '10px', marginRight: '10px' }}>
        <div className="leaflet-control leaflet-bar">
          <button
            onClick={handleLocate}
            className="flex h-8 w-8 items-center justify-center bg-card text-foreground hover:bg-muted"
            title="Minha localização"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="2" x2="12" y2="4" />
              <line x1="12" y1="20" x2="12" y2="22" />
              <line x1="2" y1="12" x2="4" y2="12" />
              <line x1="20" y1="12" x2="22" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}

function countNearbySightings(sighting: Sighting, allSightings: Sighting[], radiusKm: number = 0.5): number {
  const R = 6371 // Earth's radius in km
  let count = 0

  for (const other of allSightings) {
    if (other.id === sighting.id) continue
    if (other.animal_type !== sighting.animal_type) continue

    const dLat = ((other.latitude - sighting.latitude) * Math.PI) / 180
    const dLon = ((other.longitude - sighting.longitude) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((sighting.latitude * Math.PI) / 180) *
        Math.cos((other.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    if (distance <= radiusKm) {
      count++
    }
  }

  return count
}

export default function MapComponent({
  sightings,
  onLocationSelect,
  selectionMode = false,
  selectedPosition,
}: MapComponentProps) {
  return (
    <MapContainer
      center={[DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng]}
      zoom={13}
      className="h-full w-full rounded-lg"
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <UserLocationButton />
      
      {selectionMode && <LocationMarker onLocationSelect={onLocationSelect} />}
      
      {selectedPosition && (
        <Marker position={[selectedPosition.lat, selectedPosition.lng]} icon={defaultIcon}>
          <Popup>Local selecionado</Popup>
        </Marker>
      )}

      {sightings.map((sighting) => {
        const nearbyCount = countNearbySightings(sighting, sightings)
        const isCrowded = nearbyCount >= CROWD_THRESHOLD
        
        return (
          <Marker
            key={sighting.id}
            position={[sighting.latitude, sighting.longitude]}
            icon={isCrowded ? crowdIcon : animalIcon}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{sighting.animal_type}</p>
                {sighting.description && (
                  <p className="text-sm text-muted-foreground">{sighting.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(sighting.created_at))}
                </p>
                {isCrowded && (
                  <p className="text-xs font-medium text-accent">
                    Alta concentração de visitantes
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
