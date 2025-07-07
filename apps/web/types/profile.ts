export type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';

export type BasicInfoTypes = {
    picture?: string; 
    fullName: string;
    dob: Date | string; 
    gender: Gender;
    weight: number; 
    height: number; 
}

export type Relationship="parent" | "sibling" | "spouse" | "friend" | "other"
export type EmergencyTypes={
    
  firstname: string;
  lastname: string;
  phoneNumber: string;
  relationship: Relationship;

}
