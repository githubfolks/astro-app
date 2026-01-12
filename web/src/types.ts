export interface Astrologer {
    id: number;
    full_name: string;
    profile_picture_url?: string;
    specialties: string;
    languages: string;
    experience_years: number;
    consultation_fee_per_min: number;
    rating_avg: number;
    is_online: boolean;
}
