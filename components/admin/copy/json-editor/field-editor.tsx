"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageInput } from "./image-input";
import { ArrayEditor } from "./array-editor";

interface FieldEditorProps {
    value: any;
    onChange: (value: any) => void;
    label?: string;
    path?: string; // 현재 필드의 경로 (예: "hero.title")
}

export function FieldEditor({ value, onChange, label, path = "" }: FieldEditorProps) {
    // 1. Null/Undefined 처리
    if (value === null || value === undefined) {
        return (
            <div className="space-y-2">
                {label && <Label>{label}</Label>}
                <div className="text-sm text-gray-500 italic">값 없음 (null)</div>
            </div>
        );
    }

    // 2. 배열 처리
    if (Array.isArray(value)) {
        return (
            <ArrayEditor
                value={value}
                onChange={onChange}
                label={label}
                path={path}
            />
        );
    }

    // 3. 객체 처리
    if (typeof value === "object") {
        return (
            <div className="space-y-4 rounded-md border border-gray-200 p-4">
                {label && <h4 className="font-medium text-gray-900">{label}</h4>}
                <div className="space-y-4">
                    {Object.entries(value).map(([key, val]) => (
                        <FieldEditor
                            key={key}
                            value={val}
                            onChange={(newValue) => {
                                onChange({ ...value, [key]: newValue });
                            }}
                            label={key}
                            path={`${path}.${key}`}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // 4. 문자열 처리
    if (typeof value === "string") {
        // 이미지 URL 감지 (키 이름이나 값의 형식으로)
        const isImage =
            path.toLowerCase().includes("image") ||
            path.toLowerCase().includes("url") ||
            path.toLowerCase().includes("src") ||
            value.match(/^https?:\/\/.*\.(jpg|jpeg|png|webp|gif|svg)/i);

        if (isImage) {
            return (
                <ImageInput
                    value={value}
                    onChange={onChange}
                    label={label}
                />
            );
        }

        // 긴 텍스트는 Textarea
        if (value.length > 50 || path.toLowerCase().includes("description") || path.toLowerCase().includes("content")) {
            return (
                <div className="space-y-2">
                    {label && <Label>{label}</Label>}
                    <Textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>
            );
        }

        // 짧은 텍스트는 Input
        return (
            <div className="space-y-2">
                {label && <Label>{label}</Label>}
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        );
    }

    // 5. 불리언 처리
    if (typeof value === "boolean") {
        return (
            <div className="flex items-center space-x-2">
                <Switch
                    checked={value}
                    onCheckedChange={onChange}
                    id={`switch-${path}`}
                />
                {label && <Label htmlFor={`switch-${path}`}>{label}</Label>}
            </div>
        );
    }

    // 6. 숫자 처리
    if (typeof value === "number") {
        return (
            <div className="space-y-2">
                {label && <Label>{label}</Label>}
                <Input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                />
            </div>
        );
    }

    // 그 외 (Fallback)
    return (
        <div className="space-y-2">
            {label && <Label>{label}</Label>}
            <Input
                value={String(value)}
                onChange={(e) => onChange(e.target.value)}
                disabled
            />
        </div>
    );
}
