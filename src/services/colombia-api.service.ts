/**
 * ColombiaApiService - Servicio para interactuar con la API de Colombia
 * https://api-colombia.com/api/v1
 */

import { EXTERNAL_URLS } from '../constants'

const API_BASE_URL = EXTERNAL_URLS.COLOMBIA_API_BASE_URL

export interface Region {
  id: number
  name: string
  description: string
  departments: Department[] | null
}

export interface Department {
  id: number
  name: string
  description: string
  cityCapitalId: number
  municipalities: number
  surface: number
  population: number
  phonePrefix: string
  countryId: number
  cityCapital?: City | null
  country?: any | null
  cities?: City[] | null
  regionId: number
  region?: Region | null
  naturalAreas?: any[] | null
  maps?: any[] | null
  indigenousReservations?: any[] | null
  airports?: any[] | null
}

export interface City {
  id: number
  name: string
  description: string
  surface: number
  population: number
  postalCode: string
  departmentId: number
  department?: Department | null
  touristAttractions?: any[] | null
  presidents?: any[] | null
  indigenousReservations?: any[] | null
  airports?: any[] | null
  radios?: any[] | null
}

class ColombiaApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  /**
   * Obtener todas las regiones de Colombia
   */
  async getRegions(): Promise<Region[]> {
    try {
      const response = await fetch(`${this.baseUrl}/Region`)
      if (!response.ok) {
        throw new Error('Error al cargar las regiones')
      }
      return await response.json()
    } catch (error) {
      return []
    }
  }

  /**
   * Obtener todos los departamentos de Colombia
   */
  async getDepartments(): Promise<Department[]> {
    try {
      const response = await fetch(`${this.baseUrl}/Department`)
      if (!response.ok) {
        throw new Error('Error al cargar los departamentos')
      }
      return await response.json()
    } catch (error) {
      return []
    }
  }

  /**
   * Obtener departamentos por región
   */
  async getDepartmentsByRegion(regionId: number): Promise<Department[]> {
    try {
      const response = await fetch(`${this.baseUrl}/Department`)
      if (!response.ok) {
        throw new Error('Error al cargar los departamentos')
      }
      const departments: Department[] = await response.json()
      return departments.filter(dept => dept.regionId === regionId)
    } catch (error) {
      return []
    }
  }

  /**
   * Obtener todas las ciudades de Colombia
   */
  async getCities(): Promise<City[]> {
    try {
      const response = await fetch(`${this.baseUrl}/City`)
      if (!response.ok) {
        throw new Error('Error al cargar las ciudades')
      }
      return await response.json()
    } catch (error) {
      return []
    }
  }

  /**
   * Obtener ciudades por departamento
   */
  async getCitiesByDepartment(departmentId: number): Promise<City[]> {
    try {
      const response = await fetch(`${this.baseUrl}/Department/${departmentId}/cities`)
      if (!response.ok) {
        throw new Error('Error al cargar las ciudades')
      }
      return await response.json()
    } catch (error) {
      return []
    }
  }
}

export const colombiaApiService = new ColombiaApiService()
