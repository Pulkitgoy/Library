import React from 'react'


interface Props{
    className:string;
    variant:"wide" | "tall";
    coverColor:string;
    coverImage:string;
}
const BookCover = ({className, variant, coverColor, coverImage}: Props) => {
  return (
    <div>BookCover</div>
  )
}

export default BookCover