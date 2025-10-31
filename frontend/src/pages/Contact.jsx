import Title from '../components/Title'
import { assets } from '../assets/assets'
import NewsletterBox from '../components/NewsletterBox'
import usePageMetadata from '../hooks/usePageMetadata'

const Contact = () => {
  usePageMetadata({
    title: 'Contact TinyMillion',
    description:
      'Reach the TinyMillion team for customer support, partnership enquiries, or creator collaborations in Noida and Saharanpur.',
    keywords: 'TinyMillion contact, customer support, TinyMillion address, TinyMillion phone',
    canonical: '/contact',
    structuredData: ({ absoluteCanonical, baseTitle, pageDescription }) => [
      {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        '@id': `${absoluteCanonical}#contact`,
        url: absoluteCanonical,
        name: baseTitle,
        description: pageDescription,
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            telephone: '+91-9258808835',
            email: 'hello.tinymillion@gmail.com',
            areaServed: 'IN',
            availableLanguage: ['English'],
          },
        ],
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'House No 119, Patthar Ka Kuan Duddha, Deoband',
          addressLocality: 'Saharanpur',
          addressRegion: 'Uttar Pradesh',
          postalCode: '247554',
          addressCountry: 'IN',
        },
      },
    ],
  })

  return (
    <div>

      <div className='text-center text-2xl pt-10 border-t'>
          <Title text1={'CONTACT'} text2={'US'} />
      </div>

      <div className='my-10 flex flex-col justify-center md:flex-row gap-10 mb-28'>
        <picture className='block w-full md:max-w-[480px]'>
          <source
            srcSet={`${assets.contact_img_480w} 480w, ${assets.contact_img_768w} 768w, ${assets.contact_img} 1200w`}
            sizes='(max-width: 768px) 100vw, 480px'
            type='image/webp'
          />
          <img
            className='w-full md:max-w-[480px] h-auto'
            src={assets.contact_img_png}
            srcSet={`${assets.contact_img_png} 1200w`}
            alt="Visit TinyMillion customer experience studio"
            loading='lazy'
            decoding='async'
          />
        </picture>
        <div className='flex flex-col justify-center items-start gap-6'>
          <p className='font-semibold text-xl text-gray-600'>Our Store</p>
          <p className=' text-gray-500'>TinyMillion HQ <br />House No 119, Patthar Ka Kuan Duddha, <br /> Deoband, Saharanpur, Uttar Pradesh-247554, India<br /> </p>
          <p className='font-semibold text-xl text-gray-600'>Branch office:</p>
          <p className=' text-gray-500'>Sector 62, Noida, Uttar Pradesh, India <br /> Email:hello.tinymillion@gmail.com <br /> Tel: +91 9258808835</p>
          <p className='font-semibold text-xl text-gray-600'>Careers at TinyMillion</p>
          <p className=' text-gray-500'>Learn more about our teams and job openings.</p>
          <button className='border border-black px-8 py-4 text-sm hover:bg-black hover:text-white transition-all duration-500'>Explore Jobs</button>
        </div>
      </div>

      <NewsletterBox/>
    </div>
  )
}

export default Contact
