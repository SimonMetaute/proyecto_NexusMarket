/**
 * Service Port: PasswordServicePort
 * Source: SDD/Domain/output-ports.md (Section 4.16)
 */

export type PasswordHash = string;
export type PlainPassword = string;

export interface PasswordServicePort {
  hash(password: PlainPassword): Promise<PasswordHash>;
  matches(password: PlainPassword, hash: PasswordHash): Promise<boolean>;
}
