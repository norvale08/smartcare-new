import React from 'react'
import { Toaster } from 'react-hot-toast'

const CustomToaster = () => {
  return (
    <Toaster 
            position="top-center"
            toastOptions={{
                duration: 4000,
                className: 'bg-gray-700 text-white border border-gray-600 rounded-lg text-sm font-medium p-3 shadow-lg',
                success: {
                    duration: 3000,
                    className: 'bg-green-500 text-white border border-green-600 rounded-lg text-sm font-medium p-3 shadow-lg',
                    iconTheme: {
                        primary: '#ffffff',
                        secondary: '#10b981',
                    },
                },
                error: {
                    duration: 5000,
                    className: 'bg-red-500 text-white border border-red-600 rounded-lg text-sm font-medium p-3 shadow-lg',
                    iconTheme: {
                        primary: '#ffffff',
                        secondary: '#ef4444',
                    },
                },
                loading: {
                    className: 'bg-blue-500 text-white border border-blue-600 rounded-lg text-sm font-medium p-3 shadow-lg',
                    iconTheme: {
                        primary: '#ffffff',
                        secondary: '#3b82f6',
                    },
                },
            }}
        />
  )
}

export default CustomToaster