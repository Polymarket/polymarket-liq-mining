export const createStringMap = (
  arrayOfStrings: string[]
): { [key: string]: boolean } => {
  return arrayOfStrings
    .map((addr) => addr.toLowerCase())
    .reduce((acc, curr) => {
      if (!acc[curr]) {
        acc[curr] = true;
      }
      return acc;
    }, {});
};
