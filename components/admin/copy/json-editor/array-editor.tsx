"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { FieldEditor } from "./field-editor";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ArrayEditorProps {
    value: any[];
    onChange: (value: any[]) => void;
    label?: string;
    path?: string;
}

export function ArrayEditor({ value, onChange, label, path = "" }: ArrayEditorProps) {
    const handleAdd = () => {
        // 배열의 첫 번째 아이템을 템플릿으로 사용하거나 빈 객체/문자열 추가
        let newItem: any = "";
        if (value.length > 0) {
            const firstItem = value[0];
            if (typeof firstItem === "object") {
                // 깊은 복사 대신 구조만 복사 (값은 초기화)
                newItem = JSON.parse(JSON.stringify(firstItem));
                // TODO: 객체 값 초기화 로직 (필요 시)
            } else if (typeof firstItem === "number") {
                newItem = 0;
            } else if (typeof firstItem === "boolean") {
                newItem = false;
            }
        } else {
            // 빈 배열인 경우, path나 label을 보고 추론하거나 기본적으로 빈 객체 추가
            // 여기서는 간단히 빈 문자열로 시작하고 사용자가 직접 JSON 편집으로 수정하게 유도할 수도 있음
            // 하지만 편의를 위해 빈 객체로 시작
            newItem = {};
        }

        onChange([...value, newItem]);
    };

    const handleRemove = (index: number) => {
        const newValue = [...value];
        newValue.splice(index, 1);
        onChange(newValue);
    };

    const handleMove = (index: number, direction: "up" | "down") => {
        if (direction === "up" && index === 0) return;
        if (direction === "down" && index === value.length - 1) return;

        const newValue = [...value];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        [newValue[index], newValue[targetIndex]] = [newValue[targetIndex], newValue[index]];
        onChange(newValue);
    };

    const handleChangeItem = (index: number, itemValue: any) => {
        const newValue = [...value];
        newValue[index] = itemValue;
        onChange(newValue);
    };

    return (
        <div className="space-y-2 rounded-md border border-gray-200 p-4 bg-gray-50/50">
            <div className="flex items-center justify-between">
                {label && <Label className="text-base font-semibold">{label} ({value.length})</Label>}
                <Button variant="outline" size="sm" onClick={handleAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    항목 추가
                </Button>
            </div>

            <div className="space-y-3">
                {value.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start group">
                        <div className="flex-1">
                            {typeof item === "object" && item !== null ? (
                                <Accordion type="single" collapsible className="w-full bg-white rounded-md border">
                                    <AccordionItem value={`item-${index}`} className="border-none">
                                        <AccordionTrigger className="px-4 py-2 hover:no-underline">
                                            <span className="text-sm font-medium">
                                                #{index + 1} {item.title || item.name || item.label || "항목"}
                                            </span>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pb-4 pt-0">
                                            <FieldEditor
                                                value={item}
                                                onChange={(val) => handleChangeItem(index, val)}
                                                path={`${path}[${index}]`}
                                            />
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            ) : (
                                <div className="bg-white p-3 rounded-md border">
                                    <FieldEditor
                                        value={item}
                                        onChange={(val) => handleChangeItem(index, val)}
                                        path={`${path}[${index}]`}
                                        label={`#${index + 1}`}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-1 pt-1 opacity-50 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleMove(index, "up")}
                                disabled={index === 0}
                                title="위로 이동"
                            >
                                <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleMove(index, "down")}
                                disabled={index === value.length - 1}
                                title="아래로 이동"
                            >
                                <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleRemove(index)}
                                title="삭제"
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                ))}

                {value.length === 0 && (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-md">
                        항목이 없습니다. 추가 버튼을 눌러 항목을 생성하세요.
                    </div>
                )}
            </div>
        </div>
    );
}
