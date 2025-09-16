export const diabetesValidationRules={
    glucose:{
        required:"glucose level is required",
        pattern:{
            value:/^[0-9]+$/,
            message :"glucose level should be numbers"
        },
        min:{
            value:20,
            message:"Too low to be realistic"
        },
        max:{
            value:600,
            message:"Too high to be realistic"
        },
       
    },
     context:{
            required:"please select a context"
        }
}