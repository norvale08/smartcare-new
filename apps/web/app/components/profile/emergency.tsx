import React from 'react'
import { Button, Input, Label } from '@repo/ui'

const Emergency = () => {
  return (
    <div className='flex min-w-screen min-h-screen items-center justify-center'>
      <div className='shadow-[4px_0_4px_0_rgba(0,0,0,0.2)] w-1/2 rounded-md px-3 py-1 h-1/2'>
        <form>
            <h1 className='text-center'>EMERGENCY CONTACT</h1>
            <div>
                <Label htmlFor="firstname">FirstName</Label>
                <Input type="text" />
            </div>
            <div>
                <Label htmlFor="lastname">LastName</Label>
                <Input type="text" />
            </div>
            <div>
                <Label htmlFor="phonenumber">Phone Number</Label>
                <Input type="text" />
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
        </form>
      </div>
    </div>
  )
}

export default Emergency

