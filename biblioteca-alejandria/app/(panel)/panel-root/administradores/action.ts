import { randomBytes } from "crypto";

function generateRandomPassword(length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    const bytes = randomBytes(length);
    let password = "";
    for (let i = 0; i < length; i++) {
        const index = bytes[i] % chars.length;
        password += chars.charAt(index);
    }
    return password;
}


export function createAdmin(email: string){
    const password = generateRandomPassword(12);
    
}