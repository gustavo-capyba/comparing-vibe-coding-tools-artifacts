export type Nationality = 'BR' | 'US'

export type DocumentType = 'CPF' | 'RG' | 'ID'

export interface Profile {
  id: string
  nationality: Nationality
  phone: string
  vehicle_plate: string
  document_type: DocumentType
  document_number: string
  created_at: string
}

export interface Sighting {
  id: string
  user_id: string
  animal_type: string
  latitude: number
  longitude: number
  description?: string
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  animal_type: string
  created_at: string
}

export interface Emergency {
  id: string
  user_id: string
  latitude: number
  longitude: number
  description?: string
  status: 'active' | 'resolved'
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  sighting_id?: string
  message: string
  read: boolean
  created_at: string
}

export interface SignUpFormData {
  email: string
  password: string
  nationality: Nationality
  phone: string
  vehicle_plate: string
  document_type: DocumentType
  document_number: string
}

export const ANIMAL_TYPES = [
  'Onça-pintada',
  'Tamanduá-bandeira',
  'Capivara',
  'Anta',
  'Lobo-guará',
  'Jacaré',
  'Arara-azul',
  'Tucano',
  'Macaco-prego',
  'Tatu',
  'Veado',
  'Quati',
  'Outro',
] as const

export type AnimalType = (typeof ANIMAL_TYPES)[number]

export const CROWD_THRESHOLD = 10

export const DEFAULT_LOCATION = {
  lat: -8.0476,
  lng: -34.877,
  name: 'Recife, PE',
}
