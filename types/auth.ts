import { Profile } from "./profile.ts";

export interface User {
  id: string;
  email?: string;
}

export interface UserWithProfile extends User {
  profile?: Profile | null;
}
