export const diabetesValidationRules = {
  glucose: {
    required: "Glucose level is required",
    pattern: {
      value: /^[0-9]+$/,
      message: "Glucose level should be numbers",
    },
    min: {
      value: 20,
      message: "Too low to be realistic",
    },
    max: {
      value: 600,
      message: "Too high to be realistic",
    },
  },

  systolic: {
    
    pattern: {
      value: /^[0-9]+$/,
      message: "Systolic pressure should be a number",
    },
    min: {
      value: 70,
      message: "Too low to be realistic",
    },
    max: {
      value: 250,
      message: "Too high to be realistic",
    },
  },

  diastolic: {
    
    pattern: {
      value: /^[0-9]+$/,
      message: "Diastolic pressure should be a number",
    },
    min: {
      value: 40,
      message: "Too low to be realistic",
    },
    max: {
      value: 150,
      message: "Too high to be realistic",
    },
  },

  heartRate: {
   
    pattern: {
      value: /^[0-9]+$/,
      message: "Heart rate should be a number",
    },
    min: {
      value: 40,
      message: "Too low to be realistic",
    },
    max: {
      value: 200,
      message: "Too high to be realistic",
    },
  },

  context: {
    required: "Please select a context",
  },

  lastMealTime: {
    required: "Please select when you last ate",
  },

  mealType: {
    required: "Please select the meal type",
  },

  exerciseRecent: {
    required: "Please indicate if you exercised recently",
  },

  exerciseIntensity: {
    required: "Please select the exercise intensity",
  },
};
