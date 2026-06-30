import bcrypt from "bcryptjs";
const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, 10);
};
const comparePassword = async (plain: string, hashed: string): Promise<boolean> => {
    return bcrypt.compare(plain, hashed);
};
export default { hashPassword, comparePassword };


