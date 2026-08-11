export type User = {
    id: number;
    name: string;
    company_id: number | null;
    role: 'company_admin' | 'supervisor' | 'ojt';
    supervisor_id: number | null;
    must_change_password: boolean;
    student_id: string | null;
    program: string | null;
    year: number | null;
    company: string | null;
    department: string | null;
    position: string | null;
    supervisor_name: string | null;
    required_hours: number | null;
    start_date: string | null;
    end_date: string | null;
    email: string;
    timezone: string;
    preferences: Partial<UserPreferences> | null;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type UserPreferences = {
    date_format: 'month_first' | 'day_first' | 'iso';
    interface_density: 'comfortable' | 'compact';
    reduce_motion: boolean;
    high_contrast: boolean;
    report_updates: boolean;
    attendance_updates: boolean;
};

export type Auth = {
    user: User;
};

/* @chisel-passkeys */
export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};
/* @end-chisel-passkeys */

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
