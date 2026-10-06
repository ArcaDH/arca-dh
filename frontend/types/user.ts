// types/user.ts: matches what the backend sends (PublicUser)
export type User = {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  currentPlanId: string | null;
};

export type RegisterInput = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};
