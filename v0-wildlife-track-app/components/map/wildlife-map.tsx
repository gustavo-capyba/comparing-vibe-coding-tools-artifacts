'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { Sighting } from '@/lib/types'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Next.js
const defaultIcon = L.icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const userIcon = L.icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'user-marker',
})

L.Marker.prototype.options.icon = defaultIcon

// Default center: Recife, Brazil
const DEFAULT_CENTER: [number, number] = [-8.0476, -34.8770]
const DEFAULT_ZOOM = 13

interface WildlifeMapProps {
  sightings: Sighting[]
  onMapClick?: (lat: number, lng: number) => void
  selectedPosition?: [number, number] | null
  showUserLocation?: boolean
}

function LocationMarker({ onLocationFound }: { onLocationFound?: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const map = useMap()

  useEffect(() => {
    map.locate({ setView: true, maxZoom: 15 })
    
    map.on('locationfound', (e) => {
      setPosition([e.latlng.lat, e.latlng.lng])
      onLocationFound?.(e.latlng.lat, e.latlng.lng)
    })

    map.on('locationerror', () => {
      // Stay at default position if geolocation fails
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
    })
  }, [map, onLocationFound])

  return position ? (
    <Marker position={position} icon={userIcon}>
      <Popup>
        <div className="text-center">
          <strong>Sua localização</strong>
        </div>
      </Popup>
    </Marker>
  ) : null
}

function MapClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onClick?.(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function getAnimalIcon(animalName: string): string {
  const icons: Record<string, string> = {
    'Capivara': '🦫',
    'Jacaré': '🐊',
    'Tatu': '🦔',
    'Quati': '🦝',
    'Macaco-prego': '🐒',
    'Garça': '🦢',
    'Tucano': '🐦',
    'Cobra': '🐍',
    'Gambá': '🦨',
    'Tamanduá': '🐜',
  }
  return icons[animalName] || '🐾'
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function WildlifeMap({ 
  sightings, 
  onMapClick, 
  selectedPosition,
  showUserLocation = true,
}: WildlifeMapProps) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null)

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full rounded-lg"
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {showUserLocation && (
        <LocationMarker onLocationFound={(lat, lng) => setUserPosition([lat, lng])} />
      )}
      
      {onMapClick && <MapClickHandler onClick={onMapClick} />}
      
      {/* Sighting markers */}
      {sightings.map((sighting) => (
        <Marker
          key={sighting.id}
          position={[sighting.latitude, sighting.longitude]}
          icon={defaultIcon}
        >
          <Popup>
            <div className="min-w-[180px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getAnimalIcon(sighting.animal_type?.name || '')}</span>
                <strong className="text-base">{sighting.animal_type?.name}</strong>
              </div>
              {sighting.description && (
                <p className="text-sm text-gray-600 mb-2">{sighting.description}</p>
              )}
              <p className="text-xs text-gray-400">{formatDate(sighting.created_at)}</p>
            </div>
          </Popup>
        </Marker>
      ))}
      
      {/* Selected position marker for new sighting */}
      {selectedPosition && (
        <Marker position={selectedPosition} icon={defaultIcon}>
          <Popup>
            <div className="text-center">
              <strong>Nova localização</strong>
              <p className="text-sm text-gray-600">
                {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
