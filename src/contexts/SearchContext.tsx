// app/contexts/SearchContext.tsx
'use client'
import React, { createContext, useContext, useState, ReactNode } from 'react'

interface SearchContextType {
  searchQuery: string
  setSearchQuery: (query: string) => void
  triggerSearch: (query: string) => void
  lastSearchTrigger: number
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [lastSearchTrigger, setLastSearchTrigger] = useState(0)

  const triggerSearch = (query: string) => {
    console.log('🔍 SearchContext: Triggering search for:', query)
    setSearchQuery(query)
    setLastSearchTrigger(Date.now())
  }

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        triggerSearch,
        lastSearchTrigger,
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}