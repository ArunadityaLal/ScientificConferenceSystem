import crypto from "crypto";

export function generateSecureTempPassword(): string {
  // Generate readable but secure temporary passwords
  const adjectives = [
    "Smart",
    "Quick",
    "Bright",
    "Swift",
    "Sharp",
    "Cool",
    "Fast",
    "Bold",
  ];
  const animals = [
    "Tiger",
    "Eagle",
    "Lion",
    "Wolf",
    "Bear",
    "Hawk",
    "Fox",
    "Shark",
  ];
  const numbers = Math.floor(Math.random() * 999) + 100; // 3 digits

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];

  return `${adjective}${animal}${numbers}`;
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
