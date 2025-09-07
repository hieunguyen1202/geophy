import type { IconType } from "react-icons";

interface CustomFile extends File {
    preview: string;
}

type DisplayMode = "mobile" | "desktop" | "edit";


interface BaseListMenu{
    name: string;
    icon?: IconType;
    path: string;
}

export type {  CustomFile, DisplayMode, BaseListMenu};

export interface Chapter {
    id: number;
    chapter_name: string;
    chapter_description: string;
    subject: number;
    chapter_number: number;
    grade: number;
}

export interface Tag {
    tag_id: number;
    tag_name?: string;
    tag_description: string;
}