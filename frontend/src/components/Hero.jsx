import { assets } from '../assets/assets'

const Hero = () => {
  return (
    <div className='flex flex-col sm:flex-row border border-gray-400'>
      {/* Hero Left Side */}
      <div className='w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0'>
            <div className='text-[#414141]'>
                <div className='flex items-center gap-2'>
                    <p className='w-8 md:w-11 h-[2px] bg-[#414141]'></p>
                    <p className=' font-medium text-sm md:text-base'>OUR BESTSELLERS</p>
                </div>
                <h1 className='prata-regular text-3xl sm:py-3 lg:text-5xl leading-relaxed'>TinyMillion</h1>
                <div className='flex items-center gap-2'>
                    <p className='font-semibold text-sm md:text-base'>SHOP NOW</p>
                    <p className='w-8 md:w-11 h-[1px] bg-[#414141]'></p>
                </div>
            </div>
      </div>
      {/* Hero Right Side */}
      <picture className='block w-full sm:w-1/2'>
        <source
          srcSet={`${assets.hero_img_480w} 480w, ${assets.hero_img_768w} 768w, ${assets.hero_img_1080w} 1080w, ${assets.hero_img} 1440w`}
          sizes='(max-width: 640px) 100vw, 50vw'
          type='image/webp'
        />
        <img
          className='w-full h-auto'
          src={assets.hero_img_png}
          srcSet={`${assets.hero_img_png} 1440w`}
          alt="TinyMillion hero showcasing latest creator collection"
          loading='eager'
          decoding='async'
          fetchPriority='high'
          sizes='(min-width: 640px) 50vw, 100vw'
        />
      </picture>
    </div>
  )
}

export default Hero;
