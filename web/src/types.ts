export type AvailabilityStatus = 'ONLINE' | 'BUSY' | 'OFFLINE';

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
    availability_status?: AvailabilityStatus;
    queue_length?: number;
    about_me?: string;
    availability_hours?: string | null;
    is_premium?: boolean;
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
    availability_status?: AvailabilityStatus;
    queue_length?: number;
    availability_hours?: string | null;
    is_premium?: boolean;
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
    comment?: string | null;
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
    topic?: string | null;
    concern_note?: string | null;
    is_promotional_first_chat?: boolean;
    promotional_rate_total?: number | null;
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

// --- Kundli / FreeAstroAPI chart structures ---
// Shape matches FreeAstroAPI's POST /api/v2/vedic/calculate response.

export interface NakshatraRef {
    id?: number;
    number?: number;
    name: string;
    pada: number;
    lord: string;
}

export interface PlanetPosition {
    name: string; // "Sun", "Moon", ... "Rahu", "Ketu" (title case)
    sign: string;
    sign_id: number;
    house: number;
    degree_in_sign?: number;
    absolute_degree?: number;
    is_retrograde?: boolean;
    nakshatra?: string;
    nakshatra_id?: number;
    pada?: number;
    nakshatra_lord?: string;
}

export interface HousePosition {
    house: number;
    sign: string;
    sign_id: number;
    degree_cusp?: number;
}

export interface AscendantInfo {
    sign: string;
    sign_id: number;
    degree?: number;
    house?: number;
    nakshatra?: NakshatraRef;
}

/** A single chart / divisional chart (D1, D9, D10, D60, ...). */
export interface DivisionChart {
    division?: number;
    name?: string;
    ascendant: AscendantInfo;
    planets: PlanetPosition[];
    houses: HousePosition[];
}

export interface SadeSati {
    active: boolean;
    phase?: string;
    description?: string;
    moon_sign?: string;
    saturn_sign?: string;
}

export interface DashaPeriod {
    level: 'Mahadasha' | 'Antardasha' | 'Pratyantardasha';
    lord: string;
    start: string;
    end: string;
    duration_years: number;
    elapsed_years: number;
    remaining_years: number;
    progress_fraction: number;
    path: string[];
}

export interface VimshottariDasha {
    moon_nakshatra?: NakshatraRef;
    birth_balance?: {
        lord: string;
        actual_start: string;
        birth_date: string;
        end: string;
        full_duration_years: number;
        elapsed_years: number;
        remaining_years: number;
    };
    active_periods?: DashaPeriod[];
}

export interface Yoga {
    id: string;
    name: string;
    type: string;
    category: string;
    active: boolean;
    strength?: string;
    description: string;
    planets: string[];
    houses_involved: number[];
}

export interface YogasSection {
    yogas: Yoga[];
    summary?: {
        total_evaluated: number;
        active: number;
        inactive: number;
    };
}

export interface Panchang {
    date: string;
    sunrise?: string;
    sunset?: string;
    weekday?: { number: number; name: string };
    lunar_month?: { name: string; amanta: boolean; vikram_samvat: number };
    tithi?: { number: number; name: string; paksha: string; ends_at?: string };
    nakshatra?: NakshatraRef & { ends_at?: string };
    yoga?: { number: number; name: string; ends_at?: string };
    rahu_kalam?: { start: string; end: string };
}

export interface ShadbalaEntry {
    total: number;
    shadbala_in_rupas: number;
    minimum_requirements: number;
    ratio: number;
}

export interface Ashtakavarga {
    total_points: number;
    sarvashtakavarga?: Record<string, number>;
}

/** Full FreeAstroAPI /vedic/calculate response, as stored in kundli_reports.chart_data. */
export interface ChartData {
    ayanamsha?: string;
    timezone_used?: string;
    chart?: DivisionChart & { sade_sati?: SadeSati };
    vargas?: { vargas: Record<string, DivisionChart> };
    vimshottari_dasha?: VimshottariDasha;
    yogas?: YogasSection;
    panchang?: Panchang;
    shadbala?: Record<string, ShadbalaEntry>;
    ashtakavarga?: Ashtakavarga;
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
