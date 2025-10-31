import Hero from '../components/Hero'
import LatestCollection from '../components/LatestCollection'
import BestSeller from '../components/BestSeller'

import OurPolicy from '../components/OurPolicy'
import NewsletterBox from '../components/NewsletterBox'
import usePageMetadata from '../hooks/usePageMetadata'

const Home = () => {
  usePageMetadata({
    title: 'Discover New Fashion Drops',
    description:
      'Explore TinyMillion for creator-led fashion drops, jewellery, and lifestyle essentials curated for everyday confidence.',
    keywords:
      'TinyMillion collections, new arrivals, creator fashion, trending outfits, lifestyle store',
    canonical: '/',
    structuredData: ({ absoluteCanonical, pageDescription, absoluteImage, baseTitle }) => [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `${absoluteCanonical}#home-collections`,
        url: absoluteCanonical,
        name: baseTitle,
        description: pageDescription,
        image: absoluteImage,
      },
    ],
  })

  return (
    <div>
      <Hero />
      <LatestCollection/>
      <BestSeller/>
      
      <OurPolicy/>
      <NewsletterBox/>
    </div>
  )
}

export default Home
