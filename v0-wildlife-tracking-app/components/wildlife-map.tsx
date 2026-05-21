'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix para ícones do Leaflet no Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

// Ícones customizados para diferentes tipos
const createAnimalIcon = (color: string) => L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    background-color: ${color};
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const animalIcons: Record<string, L.DivIcon> = {
  mamifero: createAnimalIcon('#8B4513'),
  ave: createAnimalIcon('#4169E1'),
  reptil: createAnimalIcon('#228B22'),
  anfibio: createAnimalIcon('#9932CC'),
  peixe: createAnimalIcon('#00CED1'),
  inseto: createAnimalIcon('#FFD700'),
  outro: createAnimalIcon('#808080'),
}

export interface Sighting {
  id: string
  animal_type: string
  description: string | null
  latitude: number
  longitude: number
  photo_url: string | null
  created_at: string
}

interface WildlifeMapProps {
  sightings: Sighting[]
  onMapClick?: (lat: number, lng: number) => void
  userLocation?: { lat: number; lng: number } | null
  selectMode?: boolean
  selectedPosition?: { lat: number; lng: number } | null
}

// Componente para centralizar no usuário
function UserLocationMarker({ position }: { position: { lat: number; lng: number } }) {
  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={L.divIcon({
        className: 'user-marker',
        html: `<div style="
          background-color: #3B82F6;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })}
    >
      <Popup>Sua localização</Popup>
    </Marker>
  )
}

// Componente para capturar cliques no mapa
function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

// Componente para centralizar mapa
function CenterMap({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView([center.lat, center.lng], 13)
  }, [map, center.lat, center.lng])
  
  return null
}

export default function WildlifeMap({
  sightings,
  onMapClick,
  userLocation,
  selectMode = false,
  selectedPosition,
}: WildlifeMapProps) {
  const [mounted, setMounted] = useState(false)
  const mapRef = useRef<L.Map | null>(null)
  
  // Fallback: Recife, PE, Brasil
  const defaultCenter = { lat: -8.0476, lng: -34.877 }
  const center = userLocation || defaultCenter

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <p className="text-muted-foreground">Carregando mapa...</p>
      </div>
    )
  }

  const getAnimalIcon = (type: string) => {
    const normalizedType = type.toLowerCase()
    if (normalizedType.includes('mamif') || normalizedType.includes('mammal')) return animalIcons.mamifero
    if (normalizedType.includes('ave') || normalizedType.includes('bird') || normalizedType.includes('pássaro')) return animalIcons.ave
    if (normalizedType.includes('reptil') || normalizedType.includes('reptile') || normalizedType.includes('cobra') || normalizedType.includes('lagarto')) return animalIcons.reptil
    if (normalizedType.includes('anfíbio') || normalizedType.includes('anfibio') || normalizedType.includes('sapo') || normalizedType.includes('rã')) return animalIcons.anfibio
    if (normalizedType.includes('peixe') || normalizedType.includes('fish')) return animalIcons.peixe
    if (normalizedType.includes('inseto') || normalizedType.includes('insect') || normalizedType.includes('borboleta') || normalizedType.includes('abelha')) return animalIcons.inseto
    return animalIcons.outro
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      className="h-full w-full rounded-lg"
      ref={mapRef}
      style={{ cursor: selectMode ? 'crosshair' : 'grab' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {userLocation && <CenterMap center={userLocation} />}
      
      {selectMode && <MapClickHandler onMapClick={onMapClick} />}
      
      {userLocation && <UserLocationMarker position={userLocation} />}
      
      {selectedPosition && (
        <Marker
          position={[selectedPosition.lat, selectedPosition.lng]}
          icon={L.divIcon({
            className: 'selected-marker',
            html: `<div style="
              background-color: #EF4444;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              animation: pulse 1s infinite;
            "></div>
            <style>
              @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
              }
            </style>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })}
        >
          <Popup>Local selecionado para o avistamento</Popup>
        </Marker>
      )}
      
      {sightings.map((sighting) => (
        <Marker
          key={sighting.id}
          position={[sighting.latitude, sighting.longitude]}
          icon={getAnimalIcon(sighting.animal_type)}
        >
          <Popup>
            <div className="min-w-48">
              <h3 className="font-semibold text-foreground">{sighting.animal_type}</h3>
              {sighting.description && (
                <p className="mt-1 text-sm text-muted-foreground">{sighting.description}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {formatDate(sighting.created_at)}
              </p>
              {sighting.photo_url && (
                <img
                  src={sighting.photo_url}
                  alt={sighting.animal_type}
                  className="mt-2 h-24 w-full rounded object-cover"
                />
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
