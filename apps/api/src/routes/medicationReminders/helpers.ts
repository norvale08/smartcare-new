// apps/api/src/routes/medicationReminders/helpers.ts
export const mapToObject = (map: any): any => {
  if (!map) return {};
  if (map instanceof Map) {
    const obj: any = {};
    map.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
  return map;
};