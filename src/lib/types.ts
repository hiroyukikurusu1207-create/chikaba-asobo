export type EventRow = {
  id: string;
  title: string;
  genre: string[];
  start_date: string;
  end_date: string | null;
  venue_name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  description: string | null;
  target_age: string | null;
  event_time: string | null;
  source: string;
  source_url: string | null;
  created_at: string;
  updated_at: string;
};
