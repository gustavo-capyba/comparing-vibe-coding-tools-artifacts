export type Nationality = 'BR' | 'US'

export type DocumentType = 'CPF' | 'RG' | 'DRIVER_LICENSE'

export interface Profile {
  id: string
  nationality: Nationality
  phone: string
  vehicle_plate: string
  document_type: DocumentType
  document_number: string
  created_at: string
  updated_at: string
}

export interface AnimalType {
  id: string
  name: string
  description: string | null
  icon: string | null
  created_at: string
}

export interface Sighting {
  id: string
  user_id: string
  animal_type_id: string
  latitude: number
  longitude: number
  description: string | null
  created_at: string
  animal_type?: AnimalType
}

export interface Subscription {
  id: string
  user_id: string
  animal_type_id: string
  notify_in_app: boolean
  notify_email: boolean
  created_at: string
  animal_type?: AnimalType
}

export interface Notification {
  id: string
  user_id: string
  sighting_id: string | null
  message: string
  read: boolean
  created_at: string
  sighting?: Sighting
}

export interface Emergency {
  id: string
  user_id: string
  latitude: number
  longitude: number
  description: string | null
  status: 'pending' | 'acknowledged' | 'resolved'
  created_at: string
  resolved_at: string | null
}

export interface CrowdSettings {
  id: string
  threshold: number
  radius_meters: number
  created_at: string
  updated_at: string
}

export interface SignUpFormData {
  email: string
  password: string
  confirmPassword: string
  nationality: Nationality
  phone: string
  vehiclePlate: string
  documentType: DocumentType
  documentNumber: string
}
