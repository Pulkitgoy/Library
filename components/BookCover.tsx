import { cn } from '@/lib/utils';
import React from 'react'
import Image from 'next/image';
type BookCoverVariant = "extraSmall" | "small" | "medium" | "regular" | "large" | "wide";
const variantStyles:Record<BookCoverVariant, string> = {
    extraSmall: "book-cover_extra_small",
    small: "book-cover_small",
    medium: "book-cover_medium",
    regular: "book-cover_regular",
    large: "book-cover_large",
    wide: "book-cover_wide",
}

interface Props{
    className?:string;
    variant?:BookCoverVariant;
    coverColor:string;
    coverImage:string;
}
const BookCover = ({className, variant='regular', coverColor='#012B48', coverImage='https://placehold.co/400x600'}: Props) => {
  return (
    <div className={cn("relative transition-all duration-300", variantStyles[variant], className)}>
      BOOK SIDE SVG
      <div className='absolute z-10 overflow-hidden' style={{left:'12%', width:'87.5%' , height:"88%"}}>
        <Image src={coverImage} alt="Book cover" fill sizes="(max-width: 768px) 40vw, 20vw" className='object-fill' />
      </div>
    </div>
  )
}

export default BookCover