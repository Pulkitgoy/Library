"use-client";
import React from 'react'
import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
interface props<T extends FieldValues>{

}

const AuthForm = ({type, schema, defaultValues, onSubmit}:props) => {
  return (
    <div>AuthForm-- {type}</div>
  )
}

export default AuthForm;