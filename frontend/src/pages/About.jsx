import Title from '../components/Title'
import { assets } from '../assets/assets'
import NewsletterBox from '../components/NewsletterBox'
import usePageMetadata from '../hooks/usePageMetadata'

const About = () => {
  usePageMetadata({
    title: 'About TinyMillion',
    description:
      'Learn how TinyMillion blends timeless silhouettes with modern culture to craft creator-inspired apparel and accessories.',
    keywords: 'TinyMillion story, about TinyMillion, brand mission, creator fashion label',
    canonical: '/about',
    structuredData: ({ absoluteCanonical, pageDescription, baseTitle, absoluteImage }) => [
      {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        '@id': `${absoluteCanonical}#about`,
        url: absoluteCanonical,
        name: baseTitle,
        description: pageDescription,
        primaryImageOfPage: absoluteImage,
      },
    ],
  })

  return (
    <div>

      <div className='text-2xl text-center pt-8 border-t'>
          <Title text1={'ABOUT'} text2={'US'} />
      </div>

      <div className='my-10 flex flex-col md:flex-row gap-16'>
          <picture className='block w-full md:max-w-[450px]'>
            <source
              srcSet={`${assets.about_img_480w} 480w, ${assets.about_img_768w} 768w, ${assets.about_img} 1200w`}
              sizes='(max-width: 768px) 100vw, 450px'
              type='image/webp'
            />
            <img
              className='w-full md:max-w-[450px] h-auto'
              src={assets.about_img_png}
              srcSet={`${assets.about_img_png} 1200w`}
              alt="TinyMillion design studio team collaborating"
              loading='lazy'
              decoding='async'
            />
          </picture>
          <div className='flex flex-col justify-center gap-6 md:w-2/4 text-gray-600'>
              <p>TinyMillion is more than just a clothing brand — it&rsquo;s a movement that celebrates individuality, confidence, and modern living.
Founded with a vision to redefine everyday fashion, TinyMillion curates handpicked collections that combine timeless style with today&rsquo;s trends.
From classic staples to bold statements, our designs are made to empower — whether you&apos;re dressing for comfort, ambition, or creativity.
We believe fashion is not just about what you wear, but how it makes you feel.</p>
              <b className='text-gray-800'>Our Mission</b>
              <p>At TinyMillion, our mission is to make premium-quality fashion accessible, effortless, and expressive.
We aim to deliver a seamless shopping experience with designs that resonate with your lifestyle — from the street to the spotlight.</p>
          </div>
      </div>

      <div className=' text-xl py-4'>
          <Title text1={'WHY'} text2={'CHOOSE US'} />
      </div>

      <div className='flex flex-col md:flex-row text-sm mb-20'>
          <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
            <b>Quality You Can Trust </b>
            <p className=' text-gray-600'>Every TinyMillion product is crafted with precision and care, meeting our uncompomising quality standards - because you deserve the best.</p>
          </div>
          <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
            <b>Effortless Shopping Experience </b>
            <p className=' text-gray-600'>With an intuitive interface and fast checkout, finding your perfect style has never been easier. Fashion, just a few clicks away.</p>
          </div>
          <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
            <b>Dedicated Customer Support</b>
            <p className=' text-gray-600'>From product queries to post-purchase help, our team is here for you — every step of the way. Your satisfaction is our promise.</p>
          </div>
      </div>

      <NewsletterBox/>
      
    </div>
  )
}

export default About;
