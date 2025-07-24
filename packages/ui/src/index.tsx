// Export styles
import "./globals.css";

// Export components
export { Button, buttonVariants } from "./components/ui/button";
export { Label } from "./components/ui/label";
export { Input } from "./components/ui/input";
export {Card} from "./components/ui/card"
export {CardHeader,CardContent, CardDescription,CardTitle} from "./components/ui/card";

// Export utilities
export { cn } from "./lib/utils"; 

export * from './validation/auth';
export { profileValidationRules } from './validation/profile';
export {diabetesValidationRules} from "./validation/diabetes"