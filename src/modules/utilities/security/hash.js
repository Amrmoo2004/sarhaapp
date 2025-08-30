import bcrypt from "bcryptjs";
export const generatehash = async ({ plaintext= ""  , saltround }={}) => {
return bcrypt.hash(plaintext, Number(process.env.SALTROUNDS) );

}
export const comparehash = async (plaintext, hash) => {
  if (!plaintext || !hash) {
    throw new Error("Both plaintext password and hash are required");
  }
  return await bcrypt.compare(plaintext, hash);
};