import bcrypt from "bcrypt";
import crypto from "crypto";

import { AuthRepository } from "./auth.repository";

const authRepository = new AuthRepository();

export class AuthService {
  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    // Find user by email
    const user = await authRepository.findUserByEmail(email);

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check if account is active
    if (!user.isActive) {
      throw new Error("Your account has been disabled.");
    }

    // Compare password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isPasswordCorrect) {
      throw new Error("Invalid email or password");
    }

    // Extract roles
    const roles = user.userRoles.map((userRole) => userRole.role.name);

    // Extract permissions
    const permissions = user.userRoles.flatMap((userRole) =>
      userRole.role.rolePermissions.map(
        (rolePermission) => rolePermission.permission.code
      )
    );

    // Remove duplicate permissions
    const uniquePermissions = [...new Set(permissions)];

    // Generate refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex");

    // Refresh token expiry (7 days)
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    // Save refresh token
    await authRepository.createRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt,
      ipAddress,
      userAgent,
    });

    // Return data (Controller will generate JWT)
    return {
      user: {
        id: user.id,
        companyId: user.companyId,
        email: user.email,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
      },

      roles,
      permissions: uniquePermissions,
      refreshToken,
    };
  }
}