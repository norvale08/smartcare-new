export const profileValidationRules = {
    fullName: {
        required: "Full name is required",
        pattern: {
            value: /^[a-zA-Z\s]+$/,
            message: "Full name should only contain letters"
        },
        minLength: {
            value: 2,
            message: "Full name must be at least 2 characters"
        }
    },
    
    dob: {
        required: "Your date of birth is required",
        validate: {
            notFuture: (value: string | Date) => {
                const date = new Date(value);
                const today = new Date();
                return date <= today || "Date of birth cannot be in the future";
            }
        }
    },
    
    gender: {
        required: "Your gender is required",
        validate: {
            validGender: (value: string) => {
                const validGenders = ['male', 'female', 'other', 'prefer-not-to-say'];
                return validGenders.includes(value) || "Please select a valid gender";
            }
        }
    },
    
    weight: {
        required: "Weight is required",
        pattern: {
            value: /^[0-9]+$/,
            message: "Weight must contain only numbers (0-9)"
        },
        min: {
            value: 1,
            message: "Weight must be at least 1 kg"
        },
        max: {
            value: 500,
            message: "Weight cannot exceed 500 kg"
        }
    },
    
    height: {
        required: "Height is required",
        pattern: {
            value: /^[0-9]+$/,
            message: "Height must contain only numbers (0-9)"
        },
        min: {
            value: 50,
            message: "Height must be at least 50 cm"
        },
        max: {
            value: 300,
            message: "Height cannot exceed 300 cm"
        }
    },
   relationship:{
    required:" the relationship is required"
   },
   
   surgeries: {
    maxLength: {
      value: 300,
      message: "Surgeries description must be less than 300 characters"
    }
  },

  allergies: {
    maxLength: {
      value: 300,
      message: "Allergies description must be less than 300 characters"
    }
  }

    
}