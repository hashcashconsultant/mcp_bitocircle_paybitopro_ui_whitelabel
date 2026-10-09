import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import SearchPageContent from './SearchPageContent'

export const metadata: Metadata = {
  title: 'Search | BitoCircle',
  description: 'Search for users, projects, and insights in the BitoCircle crypto social network.',
  alternates: {
    canonical: '/search',
  },
}

export default function SearchPage() {
  return (
    <MainLayout>
      <SearchPageContent />
    </MainLayout>
  )
}