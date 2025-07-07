"use client"
import React, { useEffect } from 'react'
import {useForm} from "react-hook-form";
import { BasicInfoTypes } from '@/types/profile';
import { useState } from 'react';
import { Input, Label,Button } from '@repo/ui';
import {profileValidationRules} from "@repo/ui"


const BasicInfo = () => {
    const {register,handleSubmit,formState,reset,watch}=useForm<BasicInfoTypes>();
    const [isLoading,setIsLoading]=useState();

    useEffect(()=>{
        
        reset()

    },[reset])

    const handleFormSubmit=()=>{
        reset()
    }



     return (
    <div>
        <div>
            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <div>
                    <Label htmlFor='fullName'>Full Name</Label>
                    <Input
                    type='text'
                    placeholder='full Name'
                    {...register("fullName",profileValidationRules.fullName)}
                    />
                    {formState.errors.fullName && 
                    <p className='text-red-500'>
                        {formState.errors.fullName.message}
                    </p>
                    }
                </div>
                <div>
                    <Label htmlFor="">DOB</Label>
                    <Input
                    type='date'
                    {...register('dob',profileValidationRules.dob)}
                    />
                    {formState.errors.dob && 
                    <p className=''>
                        {formState.errors.dob.message}
                    </p>
                    }
                </div>
                <div>
                    <Label htmlFor="">Gender</Label>
                    <select 
                    id="gender"
                    {...register("gender",profileValidationRules.gender)}
                    className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent '
                    >
                        <option value="">Select your gender</option>
                        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
        <option value="prefer-not-to-say">Prefer not to say</option>
    
                        

                    </select>
                    {formState.errors.gender &&
                    <p className='text-red-500'>
                        {formState.errors.gender.message}
                    </p>
                    }
                </div>
                <div>
                    <Label htmlFor="weight">Weight</Label>
                    <Input
                    type="number"
                    {...register('weight',profileValidationRules.weight)}
                    />
                    {formState.errors.weight &&
                    <p className='text-red-500'>
                        {formState.errors.weight.message}
                    </p>
                    }
                    
                </div>
                <div>
                    <Label htmlFor="height">Height</Label>
                    <Input
                    type='number'
                    {...register('height',profileValidationRules.height)}
                    />
                    {formState.errors.height &&
                    <p className='text-red-500'>
                        {formState.errors.height.message}
                    </p>
                    }
                </div>
                <div className="mb-4">
  <Label htmlFor="picture" className="block mb-1">
    Upload your picture
  </Label>
  <input
    id="picture"
    type="file"
    accept="image/*"
    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
               file:rounded-md file:border-0 file:text-sm file:font-semibold
               file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              

  />
 
</div>

<Button type="submit" > Submit</Button>

               
            </form>

        </div>
    </div>
  )
}

export default BasicInfo 