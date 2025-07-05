"use client";
import React from 'react'
import {useForm} from 'react-hook-form'
import { Button, Input, Label } from '@repo/ui'
type emergency={
   firstname:string
   lastname:string
   phonenumber:number
   relationship:string

}

const Emergency = () => {
  const {register, handleSubmit, formState, reset}=useForm<emergency>();
  
  const handleFormSubmit=()=>{
    reset()
  }
  return (
    <div className='flex min-w-screen min-h-screen items-center justify-center'>
      <div className='shadow-[4px_0_4px_0_rgba(0,0,0,0.2)] w-1/2 rounded-md px-3 py-1 h-1/2'>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
            <h1 className='text-center'>EMERGENCY CONTACT</h1>
            <div>
                <Label htmlFor="firstname">FirstName</Label>
                <Input 
                type="text"
                id="firstname"
                 {...register("firstname",{
                    required:"First Name is required",
                    pattern:{
                      value: /^[A-Za-z\s]+$/,
                      message: "First Name should contain only letters"
                    }
                  })}
                
                />
                 {formState.errors.firstname &&(
                  <p className='text-red-400'>
                    {formState.errors.firstname.message}
                  </p>
                )}
            </div>
            <div>
                <Label htmlFor="lastname">LastName</Label>
                <Input 
                type="text"
                id="lastname"
                {...register("lastname",{
                    required:"Last Name is required",
                    pattern:{
                      value: /^[A-Za-z\s]+$/,
                      message: "Last Name should contain only letters"
                    }
                  })}
                />
                {formState.errors.lastname &&(
                  <p className='text-red-400'>
                    {formState.errors.lastname.message}
                  </p>
                )}
                
            </div>
            <div>
                <Label htmlFor="phonenumber">Phone Number</Label>
                <Input 
                type="text" 
                id="phonenumber"
                {...register("phonenumber",{
                    required:"phonenumber is required",
                    pattern:{
                      value: /^[0-9]+$/,
                      message: "phonenumber should contain only numbers"
                    }
                  })}
                />
                {formState.errors.phonenumber &&(
                  <p className='text-red-400'>
                    {formState.errors.phonenumber.message}
                  </p>
                )}
            </div>
            <div>
                <Label htmlFor="relationship">Relationship</Label>
                <select
                    name="relationship"
                    id="relationship"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
                    >
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="spouse">Spouse</option>
                    <option value="friend">Friend</option>
                    <option value="other">Other</option>
                </select>

            </div>
            <Button type="submit">Submit</Button>
        </form>
      </div>
    </div>
  )
}

export default Emergency

