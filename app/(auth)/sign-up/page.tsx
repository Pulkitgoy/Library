import AuthForm from '@/components/AuthForm'
import { SignUpSchema } from '@/lib/validations'
import React from 'react'

const Page = () => (
  <AuthForm 
    type="SIGN_UP" 
    schema={SignUpSchema} 
    defaultValues={{
      fullname:"",
      email:"",
      universityId:0,
      universityCard:"",
      password:"",
    }}
    onSubmit={()=>{}}
  />
)

export default Page