import jwt from "jsonwebtoken";

interface TokenUser {
  id: number;
  email: string;
  username: string | null;
  isAdmin: boolean;
}

function getSecrets() {
  const accessSecret =
    process.env.ACCESS_TOKEN_JWT_SECRET_KEY || process.env.JWT_SECRET || "change-me";
  const refreshSecret = process.env.REFRESH_TOKEN_JWT_SECRET_KEY || accessSecret;
  return { accessSecret, refreshSecret };
}

export function signAuthTokens(user: TokenUser) {
  const { accessSecret, refreshSecret } = getSecrets();

  const token = jwt.sign(
    { userId: user.id, email: user.email, username: user.username, isAdmin: user.isAdmin },
    accessSecret,
    { expiresIn: "7d" },
  );

  const refreshToken = jwt.sign({ userId: user.id }, refreshSecret, { expiresIn: "30d" });

  return { token, refreshToken };
}

export function authErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
