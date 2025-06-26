// /types/auth.types.ts

export type UserRegisterType = {
  firstName: string;
  lastName: string;
  email:string;
  phoneNumber: string;
  password: string;
  confirmPassword:string;
};

export type UserLoginType = {
  email: string;
  password: string;
};
