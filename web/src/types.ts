export interface Astrologer {
    id: number;
    slug?: string | null;
    full_name: string;
    profile_picture_url?: string;
    specialties: string;
    languages: string;
    experience_years: number;
    consultation_fee_per_min: number;
    rating_avg: number;
    is_online: boolean;
    about_me?: string;
    availability_hours?: string | null;
}

export interface AstrologerProfile extends Astrologer {
    user_id?: number;
    total_consultations?: number;
}

/** Raw astrologer item as returned by the public list endpoint (keyed by user_id). */
export interface AstrologerListItem {
    user_id: number;
    slug?: string | null;
    full_name?: string;
    profile_picture_url?: string;
    specialties?: string;
    languages?: string;
    experience_years?: number;
    consultation_fee_per_min?: number;
    rating_avg?: number;
    is_online?: boolean;
    availability_hours?: string | null;
}

export interface SeekerProfile {
    user_id?: number;
    full_name?: string;
    date_of_birth?: string;
    time_of_birth?: string;
    place_of_birth?: string;
    gender?: string;
    profile_picture_url?: string;
}

/** Minimal profile embedded in consultation records. */
export interface ProfileSummary {
    full_name?: string;
    profile_picture_url?: string;
}

export interface ConsultationReview {
    rating?: number;
}

export interface Consultation {
    id: number;
    astrologer_id?: number;
    seeker_id?: number;
    status: string;
    created_at: string;
    duration_seconds?: number;
    rate_per_min?: number;
    total_cost?: number;
    review?: ConsultationReview | null;
    astrologer_profile?: ProfileSummary | null;
    seeker_profile?: ProfileSummary | null;
}

export interface CourseMaterial {
    id: number;
    title?: string;
    material_type?: string;
    url?: string;
}

export interface Enrollment {
    id: number;
    user?: { email?: string; full_name?: string };
}

export interface EduSession {
    id: number;
    title?: string;
    is_active?: boolean;
    scheduled_start: string;
    scheduled_end: string;
}

export interface Batch {
    id: number;
    name?: string;
    created_at?: string;
    max_students?: number;
    enrollments?: Enrollment[];
    sessions?: EduSession[];
}

export interface Course {
    id: number;
    title?: string;
    description?: string;
    price?: number;
    is_active?: boolean;
    is_enrolled?: boolean;
    batches?: Batch[];
}

export interface BlogPost {
    id: number;
    title: string;
    slug?: string;
    content: string;
    excerpt?: string;
    featured_image?: string;
    author_name?: string;
    published_at: string;
    updated_at?: string;
}

export interface CmsPage {
    title?: string;
    content: string;
}

export interface Horoscope {
    content?: string;
    sign?: string;
    period?: string;
    date?: string;
}

/** A chat message as returned by the history endpoint. */
export interface ChatHistoryItem {
    id: number;
    sender_id: number;
    message: string;
    timestamp: string;
}

// --- Kundli / AstroAPI chart structures (loosely-typed external data) ---

export interface ChartHouse {
    rashi: number;
    planets?: string[];
}

/** A single chart division (e.g. D1/D9), keyed by house number "1".."12". */
export type ChartDivision = Record<string, ChartHouse>;

export interface PlanetDetail {
    position?: string | number;
    nakshatra?: string;
    retrograde?: boolean;
}

export interface BasicDetails {
    ayanamsha?: string;
    tithi?: string;
    yog?: string;
    karan?: string;
    vaara?: string;
    nakshatra?: string;
    sunrise?: string;
    sunset?: string;
}

/** Full AstroAPI Kundli response. */
export interface ChartData {
    basicDetails?: BasicDetails;
    charts?: Record<string, ChartDivision>;
    planets?: Record<string, PlanetDetail>;
}

export interface KundliReport {
    id: number;
    full_name?: string;
    date_of_birth?: string;
    place_of_birth?: string;
    created_at?: string;
    chart_data?: ChartData;
}

// --- Razorpay checkout (loaded via external script) ---

export interface RazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export interface RazorpayError {
    error: { description?: string; code?: string; reason?: string };
}

export interface RazorpayOptions {
    key: string;
    amount: number | string;
    currency: string;
    name: string;
    description?: string;
    order_id: string;
    handler?: (response: RazorpayResponse) => void;
    prefill?: { name?: string; email?: string; contact?: string };
    theme?: { color?: string };
}

export interface RazorpayInstance {
    open(): void;
    on(event: 'payment.failed', handler: (response: RazorpayError) => void): void;
}

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}
