import type { User } from "#repositories/users.repository";

export type UserResponse = { id: string; name: string; mobileNumber: string };

export function presentUser(user: User): UserResponse {
  return {
    id: user.id,
    name: user.name,
    mobileNumber: user.mobileNumber,
  };
}
