import { FC } from "react";

export interface User {
  name: string;
  upn: string;
  avatar?: FC | undefined | string;
}
