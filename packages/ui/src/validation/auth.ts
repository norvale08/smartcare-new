export const authValidationRules = {
  firstName: {
    required: "First name is required",
    pattern: {
      value: /^[a-zA-Z\s]+$/,
      message: "First name should only contain letters"
    },
    minLength: {
      value: 2,
      message: "First name must be at least 2 characters"
    }
  },
  
  lastName: {
    required: "Last name is required",
    pattern: {
      value: /^[a-zA-Z\s]+$/,
      message: "Last name should only contain letters"
    }
  },
  
  email: {
    required: "Email is required",
    pattern: {
      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: "Please enter a valid email address"
    }
  },
  
  password: {
    required: "Password is required",
    minLength: {
      value: 8,
      message: "Password must be at least 8 characters"
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      message: "Password must contain uppercase, lowercase, number, and special character"
    }
  },
  
  phoneNumber: {
    required: "Phone number is required",
    pattern: {
      value: /^(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/,
      message: "Please enter a valid phone number"
    }
  }
};

// Helper function for confirm password
export const getConfirmPasswordRule = (password: string) => ({
  required: "Please confirm your password",
  validate: (value: string) => value === password || "Passwords do not match"
});