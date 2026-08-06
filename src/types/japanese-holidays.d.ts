declare module "japanese-holidays" {
  export function getHolidaysOf(
    year: number,
    furikae?: boolean
  ): { month: number; date: number; name: string }[];
  export function isHoliday(date: Date, furikae?: boolean): string | undefined;
}
