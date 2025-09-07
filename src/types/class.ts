export interface Class {
    id: number;
    name: string;
    code: string;
    description: string;
    grade: number;
    lecturer_id: number;
    lecturer_name: string;
    require_approval: boolean;
}

export interface ClassListResponse {
    list: Class[];
    total: number;
}

export interface ClassApiResponse {
    message: string[];
    data: {
        list: Class[];
        total: number;
    };
}
